import { useState } from "react";
import { useDeals } from "../api/queries";
import { DealForm } from "../forms/DealForm";
import { formatMoney } from "../lib/format";
import type { Stage } from "../lib/stages";
import { Board } from "../pipeline/Board";
import { totals } from "../pipeline/boardMath";

/** The deals as cards, one column per stage. */
export function Pipeline() {
  const { data } = useDeals();
  const [adding, setAdding] = useState<Stage | null>(null);
  const open = totals(data ?? []);
  return (
    <>
      <div className="title">
        <h1>Pipeline</h1>
        <div className="pipeline-totals">
          <div>
            <div className="v mono" data-testid="open-value">
              {formatMoney(open.value)}
            </div>
            <div className="l">Open deals</div>
          </div>
          <div>
            <div className="v mono" data-testid="open-expected">
              {formatMoney(open.expected)}
            </div>
            <div className="l">Expected revenue</div>
          </div>
        </div>
      </div>
      {data && <Board deals={data} onAdd={setAdding} />}
      {adding && (
        <DealForm defaults={{ stage: adding }} onDone={() => setAdding(null)} />
      )}
    </>
  );
}
