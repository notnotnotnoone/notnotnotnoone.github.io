export type Board = { picked: string | null; buckets: Record<string, string[]> };
export type DragAction = { type: "pick"; id: string } | { type: "drop"; bucket: string } | { type: "cancel" };

export function dragReducer(state: Board, action: DragAction): Board {
  switch (action.type) {
    case "pick":
      return { ...state, picked: state.picked === action.id ? null : action.id };
    case "cancel":
      return { ...state, picked: null };
    case "drop": {
      if (!state.picked) return state;
      const id = state.picked;
      const buckets: Record<string, string[]> = {};
      for (const [name, ids] of Object.entries(state.buckets)) buckets[name] = ids.filter((x) => x !== id);
      buckets[action.bucket] = [...(buckets[action.bucket] ?? []), id];
      return { picked: null, buckets };
    }
  }
}
