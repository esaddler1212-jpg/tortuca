import {
  FREEWAY_DRONE_BUDGET,
  freewayDroneCountForPreset,
} from "../drive-world/src/freeway-traffic-drones.ts";

let failed = false;
const ok = (name: string, cond: boolean) => {
  console.log(`${cond ? "✓" : "✗"} ${name}`);
  if (!cond) failed = true;
};

ok("chromebook cap", FREEWAY_DRONE_BUDGET.chromebook === 3);
ok("chromebook playable", freewayDroneCountForPreset("chromebook") <= 3);
ok("lush denser", FREEWAY_DRONE_BUDGET.lush > FREEWAY_DRONE_BUDGET.chromebook);

if (failed) process.exitCode = 1;
else console.log("check-freeway-traffic-drones: ok");
