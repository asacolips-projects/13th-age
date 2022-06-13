// Particles

/**
 * A special full-screen weather effect which uses one Emitters to render cinders
 * @type {SpecialEffect}
 */
export class CinderWeatherEffect extends SpecialEffect {
  static get label() {
    return 'Cinder';
  }

  /* -------------------------------------------- */

  getParticleEmitters() {
    return [this._getCinderEmitter(this.parent)];
  }

  /* -------------------------------------------- */

  _getCinderEmitter(parent) {
    const d = canvas.dimensions;
    const p = (d.width / d.size) * (d.height / d.size) * this.options.density.value;
    const config = mergeObject(this.constructor.CINDER_CONFIG, {
      spawnRect: {
        x: 0,
        y: -0.10 * d.height,
        w: d.width,
        h: d.height
      },
      maxParticles: p,
      frequency: 1 / p
    }, { inplace: false });
    return new PIXI.particles.Emitter(parent, ['ui/particles/snow.png'], config);
  }
}