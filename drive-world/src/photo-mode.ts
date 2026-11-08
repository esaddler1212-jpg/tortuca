import { Vec3, type Entity } from 'playcanvas';

export type PhotoCamera = {
  active: boolean;
  pos: Vec3;
  toggle(): boolean;
  move(dt: number, keys: { fwd: boolean; back: boolean; left: boolean; right: boolean; up: boolean; down: boolean }): void;
  applyTo(camera: Entity): void;
};

export function createPhotoCamera(start: Vec3): PhotoCamera {
  const state = {
    active: false,
    pos: start.clone(),
    yaw: 0,
    pitch: 15
  };

  return {
    get active() {
      return state.active;
    },
    pos: state.pos,
    toggle() {
      state.active = !state.active;
      return state.active;
    },
    move(dt, keys) {
      if (!state.active) return;
      const speed = 45 * dt;
      const yawRad = (state.yaw * Math.PI) / 180;
      const fx = Math.sin(yawRad);
      const fz = Math.cos(yawRad);
      if (keys.fwd) {
        state.pos.x += fx * speed;
        state.pos.z += fz * speed;
      }
      if (keys.back) {
        state.pos.x -= fx * speed;
        state.pos.z -= fz * speed;
      }
      if (keys.left) {
        state.pos.x -= fz * speed;
        state.pos.z += fx * speed;
      }
      if (keys.right) {
        state.pos.x += fz * speed;
        state.pos.z -= fx * speed;
      }
      if (keys.up) state.pos.y += speed;
      if (keys.down) state.pos.y -= speed;
    },
    applyTo(camera: Entity) {
      camera.setPosition(state.pos);
      const yawRad = (state.yaw * Math.PI) / 180;
      const pitchRad = (state.pitch * Math.PI) / 180;
      const look = new Vec3(
        state.pos.x + Math.sin(yawRad) * Math.cos(pitchRad) * 30,
        state.pos.y + Math.sin(pitchRad) * 30,
        state.pos.z + Math.cos(yawRad) * Math.cos(pitchRad) * 30
      );
      camera.lookAt(look);
    }
  };
}
