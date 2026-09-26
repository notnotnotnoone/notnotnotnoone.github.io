/** Fake async work for the story. Never touches the network. */
export function simulate({
  ms = 700,
  fail = false,
  reason = "That didn't work",
}: { ms?: number; fail?: boolean; reason?: string } = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => (fail ? reject(new Error(reason)) : resolve()), ms);
  });
}
