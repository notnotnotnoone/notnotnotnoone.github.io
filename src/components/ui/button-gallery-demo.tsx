"use client";

import { Copy, Save, Trash2, Wrench, Zap } from "lucide-react";
import { Button } from "./button";

/** Temporary: every Button kind and state, for visual review. Deleted in Task 7. */
export function ButtonGalleryDemo() {
  return (
    <div className="mt-8 flex flex-wrap gap-3">
      <Button kind="primary" icon={Save} label="Save" state="idle" />
      <Button kind="primary" label="Save" workingLabel="Saving" state="working" />
      <Button kind="primary" label="Save" doneLabel="Saved" state="done" />
      <Button kind="primary" label="Save" state="failed" />
      <Button kind="fix" icon={Wrench} label="Use gemini-3-flash-preview" />
      <Button kind="test" icon={Zap} label="Test all" />
      <Button kind="copy" icon={Copy} label="Copy curl" />
      <Button kind="danger" icon={Trash2} label="Remove" />
      <Button kind="ghost" label="Replay story" />
      <Button kind="primary" label="Disabled" disabled />
    </div>
  );
}
