'use strict';

const Placeholder = require('./Placeholder')
  , Schedule = require('@delos-tech/hue-bridge-model').model.Schedule
  , UInt16Type = require('@delos-tech/hue-bridge-model').types.UInt16Type
;

module.exports = class ScheduleIdPlaceholder extends Placeholder {

  constructor(name) {
    super('id', name);
    this.typeDefinition = new UInt16Type({name: 'schedule id', optional: false});
  }

  _getParameterValue(parameter) {
    if (parameter instanceof Schedule) {
      return parameter.id;
    } else {
      return super._getParameterValue(parameter);
    }
  }
};
