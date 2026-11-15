import { format, parseISO } from "date-fns";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, ReferenceDot, Tooltip, XAxis, YAxis,
} from "recharts";
import { formatMoney, formatMoneyShort } from "../lib/format";

const INK = "#073B4C";
const MUTED = "#5B7C87";
const LINE = "#E4EBED";
const SEA = "#06D6A0";
const SEA_INK = "#05936E";
const RASP = "#EF476F";
const tick = { fontFamily: "JetBrains Mono Variable, monospace", fontSize: 11, fill: MUTED };
const tooltipStyle = { borderRadius: 10, border: 0, boxShadow: "0 8px 24px rgba(7,59,76,.15)", fontFamily: "Instrument Sans Variable" };

const monthLabel = (m: string) => format(parseISO(`${m}-01`), "MMM");
export const monthName = (m: string) => format(parseISO(`${m}-01`), "MMMM yyyy");

/** Revenue won per month: a line with a soft fill, the best month marked. */
export function RevenueChart({ months, revenue }: { months: string[]; revenue: number[] }) {
  const data = months.map((m, i) => ({ month: monthLabel(m), value: revenue[i] }));
  const peak = data.reduce((best, d) => (d.value > best.value ? d : best), data[0]);
  return (
    <AreaChart responsive style={{ width: "100%", height: 240 }} data={data} margin={{ top: 22, right: 12, left: 0, bottom: 0 }}
      accessibilityLayer aria-label="Revenue won per month">
      <CartesianGrid vertical={false} stroke={LINE} />
      <XAxis dataKey="month" tick={tick} tickLine={false} axisLine={false} tickMargin={10} />
      <YAxis tick={tick} tickLine={false} axisLine={false} width={68} tickFormatter={formatMoneyShort} />
      <Tooltip formatter={(v) => [formatMoney(Number(v)), "Revenue won"]} contentStyle={tooltipStyle} />
      <Area type="monotone" dataKey="value" stroke={SEA_INK} strokeWidth={3} fill={SEA} fillOpacity={0.14}
        activeDot={{ r: 5, fill: SEA_INK }} isAnimationActive={false} />
      {peak.value > 0 && (
        <ReferenceDot x={peak.month} y={peak.value} r={5} fill={SEA_INK} stroke="none"
          label={{ value: formatMoney(peak.value), position: "top", ...tick, fill: INK, fontWeight: 500 }} />
      )}
    </AreaChart>
  );
}

/** Deals won and lost per month, side by side. */
export function WinLossChart({ months, won, lost }: { months: string[]; won: number[]; lost: number[] }) {
  const data = months.map((m, i) => ({ month: monthLabel(m), won: won[i], lost: lost[i] }));
  return (
    <BarChart responsive style={{ width: "100%", height: 214 }} data={data} barGap={2}
      margin={{ top: 8, right: 6, left: 0, bottom: 0 }} accessibilityLayer aria-label="Deals won and lost per month">
      <CartesianGrid vertical={false} stroke={LINE} />
      <XAxis dataKey="month" tick={tick} tickLine={false} axisLine={false} tickMargin={10} />
      <YAxis tick={tick} tickLine={false} axisLine={false} width={24} allowDecimals={false} />
      <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#F0F4F5" }} />
      <Bar dataKey="won" name="Won" fill={INK} barSize={11} radius={[3, 3, 0, 0]} isAnimationActive={false} />
      <Bar dataKey="lost" name="Lost" fill={RASP} barSize={11} radius={[3, 3, 0, 0]} isAnimationActive={false} />
    </BarChart>
  );
}
