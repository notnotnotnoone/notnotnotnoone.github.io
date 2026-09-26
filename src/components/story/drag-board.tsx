"use client";

import { useReducer, useRef } from "react";
import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { GripVertical } from "lucide-react";
import { dragReducer } from "./drag";
import { useChoreo } from "./use-choreo";

/** Model cards and buckets. Three ways in: drag it, tap then tap, or Enter then Enter. */
export function DragBoard({
  initial,
  trigger,
  move,
}: {
  initial: Record<string, string[]>;
  trigger: number;
  move: { id: string; to: string };
}) {
  const reduce = useReducedMotion();
  const [board, dispatch] = useReducer(dragReducer, { picked: null, buckets: initial });
  const zones = useRef<Record<string, HTMLDivElement | null>>({});
  const dragged = useRef(false);

  useChoreo(trigger, [
    [0, () => dispatch({ type: "pick", id: move.id })],
    [600, () => dispatch({ type: "drop", bucket: move.to })],
  ]);

  const dropAt = (x: number, y: number) => {
    for (const [name, el] of Object.entries(zones.current)) {
      const r = el?.getBoundingClientRect();
      if (r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
        dispatch({ type: "drop", bucket: name });
        return;
      }
    }
    dispatch({ type: "cancel" });
  };

  return (
    <LayoutGroup id="drag">
      <div className="drag-board">
        {Object.entries(board.buckets).map(([name, ids]) => (
          <div
            key={name}
            ref={(el) => {
              zones.current[name] = el;
            }}
            className="drag-zone"
            data-armed={(board.picked !== null && !ids.includes(board.picked)) || undefined}
          >
            <button
              type="button"
              className="drag-zone-head"
              disabled={!board.picked}
              onClick={() => dispatch({ type: "drop", bucket: name })}
            >
              <span className="label">{name}</span>
              {board.picked && !ids.includes(board.picked) && <span className="drag-hint">drop here</span>}
            </button>
            <ul>
              {ids.map((id) => (
                <motion.li key={id} layoutId={reduce ? undefined : `card-${id}`} layout={!reduce}>
                  <motion.button
                    type="button"
                    className="drag-card"
                    data-picked={board.picked === id || undefined}
                    drag={!reduce}
                    dragSnapToOrigin
                    dragMomentum={false}
                    whileDrag={{ scale: 1.04, zIndex: 20, boxShadow: "0 12px 30px -8px rgba(52,211,153,0.5)" }}
                    onDragStart={() => {
                      dragged.current = true;
                      dispatch({ type: "pick", id });
                    }}
                    onDragEnd={(_, info) => dropAt(info.point.x - window.scrollX, info.point.y - window.scrollY)}
                    onClick={() => {
                      if (dragged.current) {
                        dragged.current = false;
                        return;
                      }
                      dispatch({ type: "pick", id });
                    }}
                  >
                    <GripVertical className="h-3.5 w-3.5 text-ink-4" aria-hidden />
                    {id}
                  </motion.button>
                </motion.li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </LayoutGroup>
  );
}
