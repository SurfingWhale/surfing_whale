// app/remotion/index.ts
// Registers the root with Remotion's renderer. Imported only by the CLI and
// the Studio — the page reaches DalrsReel through ReelStage, so none of this
// enters the browser bundle.
import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";

registerRoot(RemotionRoot);
