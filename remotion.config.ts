// remotion.config.ts
// Only the renderer reads this; Next never loads it.
import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// Flat vector-ish artwork on white, so a high-quality h264 of it is small.
// 18 keeps the type edges clean at 1080p.
Config.setCrf(18);
