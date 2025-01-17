import Model, { attr } from '@ember-data/model';
import { computed } from '@ember/object';
import fieldToAttrs, { expandAttributeMeta } from 'vault/utils/field-to-attrs';
import apiPath from 'vault/utils/api-path';
import attachCapabilities from 'vault/lib/attach-capabilities';

export const COMPUTEDS = {
  operationFields: computed('newFields', function () {
    return this.newFields.filter((key) => key.startsWith('operation'));
  }),

  operationFieldsWithoutSpecial: computed('operationFields', function () {
    return this.operationFields.slice().removeObjects(['operationAll', 'operationNone']);
  }),

  tlsFields: computed(function () {
    return ['tlsClientKeyBits', 'tlsClientKeyType', 'tlsClientTtl'];
  }),

  nonOperationFields: computed('newFields', 'operationFields', 'tlsFields', function () {
    let excludeFields = ['role'].concat(this.operationFields, this.tlsFields);
    return this.newFields.slice().removeObjects(excludeFields);
  }),
};

const ModelExport = Model.extend(COMPUTEDS, {
  useOpenAPI: true,
  backend: attr({ readOnly: true }),
  scope: attr({ readOnly: true }),
  name: attr({ readOnly: true }),
  getHelpUrl(path) {
    return `/v1/${path}/scope/example/role/example?help=1`;
  },
  fieldGroups: computed('fields', 'nonOperationFields.length', 'tlsFields', function () {
    const groups = [{ TLS: this.tlsFields }];
    if (this.nonOperationFields.length) {
      groups.unshift({ default: this.nonOperationFields });
    }
    let ret = fieldToAttrs(this, groups);
    return ret;
  }),

  operationFormFields: computed('operationFieldsWithoutSpecial', function () {
    let objects = [
      'operationCreate',
      'operationActivate',
      'operationGet',
      'operationLocate',
      'operationRekey',
      'operationRevoke',
      'operationDestroy',
    ];

    let attributes = ['operationAddAttribute', 'operationGetAttributes'];
    let server = ['operationDiscoverVersion'];
    let others = this.operationFieldsWithoutSpecial.slice().removeObjects(objects.concat(attributes, server));
    const groups = [
      { 'Managed Cryptographic Objects': objects },
      { 'Object Attributes': attributes },
      { Server: server },
    ];
    if (others.length) {
      groups.push({
        '': others,
      });
    }
    return fieldToAttrs(this, groups);
  }),
  tlsFormFields: computed('tlsFields', function () {
    return expandAttributeMeta(this, this.tlsFields);
  }),
  fields: computed('nonOperationFields', function () {
    return expandAttributeMeta(this, this.nonOperationFields);
  }),
});

export default attachCapabilities(ModelExport, {
  updatePath: apiPath`${'backend'}/scope/${'scope'}/role/${'id'}`,
});
