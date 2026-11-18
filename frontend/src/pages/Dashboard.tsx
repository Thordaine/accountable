import { format } from "date-fns";
import { useDashboard } from "../api/queries";
import { monthName, RevenueChart, WinLossChart } from "../dashboard/charts";
import { FollowUps, Funnel, RecentActivity } from "../dashboard/panels";
import { PipelineHero } from "../dashboard/PipelineHero";
import { formatMoney } from "../lib/format";

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

/** How sales are going at a glance, laid out as mockup B. */
export function Dashboard() {
  const { data } = useDashboard();
  return (
    <>
      <div className="title">
        <h1>Dashboard</h1>
        <span className="date">{format(new Date(), "EEEE d MMMM yyyy")}</span>
      </div>
      {data && (
        <>
          <PipelineHero open={data.open} winRate={data.win_rate} />
          <div className="row r1">
            <section className="panel" aria-label="Revenue won">
              <div className="chart-head">
                <div>
                  <h2>Revenue won</h2>
                  <p className="sub">
                    Per month, {monthName(data.months[0])} to{" "}
                    {monthName(data.months[11])}
                  </p>
                </div>
                <div>
                  <div className="v" data-testid="revenue-total">
                    {formatMoney(sum(data.revenue_won))}
                  </div>
                  <div className="l">Last 12 months</div>
                </div>
              </div>
              <RevenueChart months={data.months} revenue={data.revenue_won} />
            </section>
            <section className="panel" aria-label="Deals won and lost">
              <div className="chart-head">
                <div>
                  <h2>Deals won and lost</h2>
                  <p className="sub">Per month</p>
                </div>
                <div>
                  <div className="v">
                    {sum(data.won)} / {sum(data.lost)}
                  </div>
                  <div className="l">Won / lost</div>
                </div>
              </div>
              <div className="legend">
                <span>
                  <i style={{ background: "var(--stage-won)" }} />
                  Won
                </span>
                <span>
                  <i style={{ background: "var(--rasp)" }} />
                  Lost
                </span>
              </div>
              <WinLossChart
                months={data.months}
                won={data.won}
                lost={data.lost}
              />
            </section>
          </div>
          <div className="row r2">
            <section className="panel" aria-label="Sales funnel">
              <h2>Sales funnel</h2>
              <p className="sub">Value that reached each stage or further</p>
              <Funnel funnel={data.funnel} />
            </section>
            <section className="panel" aria-label="Follow-ups">
              <h2>Follow-ups</h2>
              <p className="sub">Overdue and due in the next 7 days</p>
              <FollowUps items={data.follow_ups} />
            </section>
            <section className="panel" aria-label="Recent activity">
              <h2>Recent activity</h2>
              <p className="sub">Newest first</p>
              <RecentActivity items={data.recent} />
            </section>
          </div>
        </>
      )}
    </>
  );
}
