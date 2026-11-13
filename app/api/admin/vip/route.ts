import { NextRequest, NextResponse } from "next/server";
import { getVipSettingsAsync, saveVipSettingsAsync, type VipTransaction } from "@/lib/vip";

/**
 * GET /api/admin/vip — Ambil semua data kuota, pendapatan, transaksi, dan analisis VIP
 *
 * Response tambahan:
 *   analytics.daily   — pendapatan per hari (7 hari terakhir)
 *   analytics.weekly  — pendapatan per minggu (4 minggu terakhir)
 *   analytics.monthly — pendapatan per bulan (6 bulan terakhir)
 *   analytics.avg_per_day — rata-rata harian dari seluruh transaksi
 *   analytics.peak_hour  — jam tersibuk transaksi
 *   analytics.top_users  — 5 kontributor VIP terbanyak
 */
export async function GET() {
  try {
    const settings = await getVipSettingsAsync();

    // ── Hitung analisis dari riwayat transaksi ──
    const transactions = settings.transactions || [];
    const now = new Date();

    // Pendapatan harian (7 hari terakhir)
    const daily: { date: string; count: number; amount: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
      const dayTrx = transactions.filter(
        (t) => t.created_at && t.created_at.slice(0, 10) === key
      );
      daily.push({
        date: key,
        count: dayTrx.length,
        amount: dayTrx.reduce((s, t) => s + (t.amount || 0), 0),
      });
    }

    // Pendapatan mingguan (4 minggu terakhir)
    const weekly: { week: string; count: number; amount: number }[] = [];
    for (let w = 3; w >= 0; w--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() - w * 7);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      const weekTrx = transactions.filter((t) => {
        const td = new Date(t.created_at);
        return td >= weekStart && td < weekEnd;
      });
      const label = `${weekStart.toISOString().slice(5, 10)}`;
      weekly.push({
        week: label,
        count: weekTrx.length,
        amount: weekTrx.reduce((s, t) => s + (t.amount || 0), 0),
      });
    }

    // Pendapatan bulanan (6 bulan terakhir)
    const monthly: { month: string; count: number; amount: number }[] = [];
    for (let m = 5; m >= 0; m--) {
      const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const key = d.toISOString().slice(0, 7); // YYYY-MM
      const monthTrx = transactions.filter(
        (t) => t.created_at && t.created_at.slice(0, 7) === key
      );
      monthly.push({
        month: key,
        count: monthTrx.length,
        amount: monthTrx.reduce((s, t) => s + (t.amount || 0), 0),
      });
    }

    // Rata-rata per hari
    let avgPerDay = 0;
    if (transactions.length > 0) {
      const oldest = new Date(
        transactions[transactions.length - 1]?.created_at || now.toISOString()
      );
      const daysDiff = Math.max(
        1,
        Math.ceil(
          (now.getTime() - oldest.getTime()) / (1000 * 60 * 60 * 24)
        )
      );
      avgPerDay = Math.round(settings.total_earned / daysDiff);
    }

    // Jam tersibuk
    const hourCounts: Record<number, number> = {};
    transactions.forEach((t) => {
      const h = new Date(t.created_at).getHours();
      hourCounts[h] = (hourCounts[h] || 0) + 1;
    });
    let peakHour = -1;
    let peakCount = 0;
    Object.entries(hourCounts).forEach(([h, c]) => {
      if (c > peakCount) {
        peakHour = Number(h);
        peakCount = c;
      }
    });

    // Top 5 pengguna
    const userMap: Record<string, { count: number; amount: number }> = {};
    transactions.forEach((t) => {
      const name = t.author_name || "Anonim";
      if (!userMap[name]) userMap[name] = { count: 0, amount: 0 };
      userMap[name].count++;
      userMap[name].amount += t.amount || 0;
    });
    const topUsers = Object.entries(userMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Proyeksi 30 hari ke depan berdasarkan rata-rata harian
    const projection30d = avgPerDay * 30;

    return NextResponse.json({
      ...settings,
      analytics: {
        daily,
        weekly,
        monthly,
        avg_per_day: avgPerDay,
        peak_hour: peakHour >= 0 ? peakHour : null,
        peak_hour_count: peakCount,
        top_users: topUsers,
        projection_30d: projection30d,
      },
    }, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (err) {
    console.error("[GET /api/admin/vip]:", err);
    return NextResponse.json({ error: "Gagal mengambil data VIP" }, { status: 500 });
  }
}

/**
 * POST /api/admin/vip — Update kuota, harga, atau reset kuota VIP (Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const current = await getVipSettingsAsync();

    const updated = {
      ...current,
      quota: typeof body.quota === "number" ? body.quota : current.quota,
      initial_quota: typeof body.initial_quota === "number" ? body.initial_quota : current.initial_quota,
      price_per_vip: typeof body.price_per_vip === "number" ? body.price_per_vip : current.price_per_vip,
      qris_image_url: typeof body.qris_image_url === "string" ? body.qris_image_url : current.qris_image_url,
    };

    await saveVipSettingsAsync(updated);
    return NextResponse.json(updated, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (err) {
    console.error("[POST /api/admin/vip]:", err);
    return NextResponse.json({ error: "Gagal memperbarui pengaturan VIP" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/vip — Reset total transaksi VIP (Admin only)
 *
 * Body opsional:
 *   { mode: "full" }   — Reset total_earned, total_transactions, dan hapus semua riwayat transaksi
 *   { mode: "history" } — Hanya hapus riwayat transaksi, total tetap
 *   Default: "full"
 */
export async function DELETE(request: NextRequest) {
  try {
    let mode = "full";
    try {
      const body = await request.json();
      if (body.mode === "history") mode = "history";
    } catch {
      // Body kosong = full reset
    }

    const current = await getVipSettingsAsync();

    if (mode === "history") {
      // Hapus riwayat saja, angka total tetap
      const updated = {
        ...current,
        transactions: [] as VipTransaction[],
      };
      await saveVipSettingsAsync(updated);
      return NextResponse.json({
        message: "Riwayat transaksi berhasil dihapus.",
        mode,
        ...updated,
      }, {
        headers: { "Cache-Control": "no-store, max-age=0" },
      });
    }

    // Full reset
    const updated = {
      ...current,
      total_earned: 0,
      total_transactions: 0,
      transactions: [] as VipTransaction[],
    };
    await saveVipSettingsAsync(updated);
    return NextResponse.json({
      message: "Total transaksi VIP berhasil di-reset.",
      mode,
      ...updated,
    }, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (err) {
    console.error("[DELETE /api/admin/vip]:", err);
    return NextResponse.json(
      { error: "Gagal mereset data transaksi VIP" },
      { status: 500 }
    );
  }
}
