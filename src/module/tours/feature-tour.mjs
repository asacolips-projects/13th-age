export class FeatureTour extends Tour {

  exit() {
    super.exit();
    game.settings.set("archmage", "lastTourVersion", this.version);
  }

  get version() {
    return this.config.version;
  }
}
