class ArchmagePrepopulate {
  constructor() {
    this.endpointBase = 'http://www.toolkit13.com/v1/json/powers';
  }

  async request(endpoint) {
    return await $.ajax({
      url: endpoint,
      type: 'GET',
      cache: false
    });
  }

  async getPowersList(powerClass = null, powerLevel = null) {
    let endpoint = `${this.endpointBase}/list/`;

    if (powerClass.length > 0) {
      endpoint += `${powerClass}/`;
    }

    if (powerLevel.length > 0) {
      endpoint += `${powerLevel}/`;
    }

    return this.request(endpoint);
  }

  async getPowersDetail(powerClass = null, powerLevel = null) {
    let endpoint = `${this.endpointBase}/detail/`;

    if (powerClass.length > 0) {
      endpoint += `${powerClass}/`;
    }

    if (powerLevel.length > 0) {
      endpoint += `${powerLevel}/`;
    }

    return this.request(endpoint);
  }

  async getPowerById(uuid) {
    let endpoint = `${this.endpointBase}/id/${uuid}`;
    return this.request(endpoint);
  }
}
