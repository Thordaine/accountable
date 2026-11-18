import { Link } from "react-router";
import type { Dashboard } from "../api/types";
import { formatMoney, formatMoneyShort } from "../lib/format";
import { STAGE_COLOR, STAGE_EXPECTED, STAGE_TEXT } from "../lib/stages";

type Props = { open: Dashboard["open"]; winRate: number | null };

/** The open pipeline: its total, the figures beside it, and the band of open stages. */
export function PipelineHero({ open, winRate }: Props) {
  const stages = open.stages.filter((s) => s.count > 0);
  return (
    <section className="panel hero" aria-labelledby="hero-title">
      <div className="hero-head">
        <div>
          <h2 id="hero-title">Open pipeline</h2>
          <div className="big">
            <small>US$</small>
            {Math.round(open.value).toLocaleString("en-US")}
          </div>
        </div>
        <div className="hero-side">
          <div>
            <div className="v">{formatMoney(open.expected)}</div>
            <div className="l">Expected revenue</div>
          </div>
          <div>
            <div className="v">{open.count}</div>
            <div className="l">
              Open deals
              {open.late > 0 && (
                <>
                  , <span className="late">{open.late} late</span>
                </>
              )}
            </div>
          </div>
          <div>
            <div className="v">{winRate === null ? "—" : `${winRate}%`}</div>
            <div className="l">Win rate, last 12 months</div>
          </div>
        </div>
      </div>
      {stages.length === 0 ? (
        <div className="river empty-river">No open deals</div>
      ) : (
        <div className="river">
          {stages.map((s) => (
            <Link
              key={s.stage}
              to="/pipeline"
              className="seg"
              style={{
                flexGrow: s.value,
                background: STAGE_COLOR[s.stage],
                color: STAGE_TEXT[s.stage],
              }}
            >
              <span
                className="exp"
                style={{
                  height: `${s.value ? (s.expected / s.value) * 100 : 0}%`,
                  background: STAGE_EXPECTED[s.stage],
                }}
              />
              <span className="name">{s.stage}</span>
              <span className="nums">
                <b>{formatMoneyShort(s.value)}</b>
                {s.count} {s.count === 1 ? "deal" : "deals"}
                <br />
                {formatMoneyShort(s.expected)} expected
              </span>
            </Link>
          ))}
        </div>
      )}
      <div className="key">
        <span>
          <i style={{ background: "var(--mist)" }} />
          Value of deals at each stage
        </span>
        <span>
          <i style={{ background: "var(--band-key-expected)" }} />
          Darker part: expected revenue
        </span>
      </div>
    </section>
  );
}
