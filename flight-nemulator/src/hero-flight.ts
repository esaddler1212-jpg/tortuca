import { Entity, Quat, Vec3 } from 'playcanvas';
import type { HeroForm, HeroSpec } from './hero-roster';

export type FlightInput = {
  pitch: number;
  yaw: number;
  roll: number;
  throttle: number;
  vertical: number;
  boost: boolean;
};

export class HeroFlightController {
  readonly entity: Entity;
  velocity = new Vec3();
  yaw = 0;
  pitch = 0;
  roll = 0;
  stamina: number;
  primaryCd = 0;
  superCd = 0;

  constructor(
    public hero: HeroSpec,
    public form: HeroForm,
    spawn: Vec3
  ) {
    this.entity = new Entity('hero');
    this.entity.setPosition(spawn);
    this.stamina = hero.energy.staminaMax;
  }

  speedKmh(): number {
    return this.velocity.length() * 3.6;
  }

  forward(): Vec3 {
    const q = new Quat();
    q.setFromEulerAngles(this.pitch, this.yaw, this.roll);
    return q.transformVector(Vec3.FORWARD);
  }

  aimPoint(dist = 80): Vec3 {
    const f = this.forward();
    const p = this.entity.getPosition();
    return new Vec3(p.x + f.x * dist, p.y + f.y * dist, p.z + f.z * dist);
  }

  update(dt: number, input: FlightInput): void {
    const cruise = (this.hero.flight.cruiseKmh / 3.6) * this.form.speedMul;
    const boost = (this.hero.flight.boostKmh / 3.6) * this.form.speedMul;
    const agility = this.hero.flight.agility;

    this.yaw -= input.yaw * agility * 1.8 * dt;
    this.pitch -= input.pitch * agility * 1.4 * dt;
    this.roll -= input.roll * agility * 1.1 * dt;
    this.pitch = Math.max(-75, Math.min(75, this.pitch));

    const targetSpeed = (input.boost ? boost : cruise) * Math.max(0, input.throttle);
    const fwd = this.forward();
    const drag = 0.92 - dt * 0.8;
    this.velocity.mulScalar(drag);
    const thrust = targetSpeed * dt * 2.4;
    this.velocity.add(new Vec3(fwd.x * thrust, fwd.y * thrust, fwd.z * thrust));

    const up = new Vec3(0, 1, 0);
    this.velocity.y += input.vertical * agility * 40 * dt;
    this.velocity.add(up.mulScalar(input.vertical * 12 * dt));

    const pos = this.entity.getPosition();
    const next = pos.clone().add(this.velocity.clone().mulScalar(dt));
    this.entity.setPosition(next.x, Math.max(2, next.y), next.z);
    this.entity.setEulerAngles(this.pitch, this.yaw, this.roll);

    if (input.boost) {
      this.stamina = Math.max(0, this.stamina - 28 * dt);
    } else {
      this.stamina = Math.min(this.hero.energy.staminaMax, this.stamina + this.hero.energy.regenPerSec * dt);
    }

    this.primaryCd = Math.max(0, this.primaryCd - dt);
    this.superCd = Math.max(0, this.superCd - dt);
  }

  canPrimary(): boolean {
    return this.primaryCd <= 0 && this.stamina > 8;
  }

  triggerPrimary(): void {
    this.primaryCd = this.hero.energy.primaryCooldownSec;
    this.stamina = Math.max(0, this.stamina - 6);
  }

  canSuper(): boolean {
    return this.superCd <= 0 && this.stamina > 30;
  }

  triggerSuper(): void {
    this.superCd = this.hero.energy.superCooldownSec;
    this.stamina = Math.max(0, this.stamina - 35);
  }
}
