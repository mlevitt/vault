import Route from '@ember/routing/route';

export default class VaultClusterSecretsCustomPathRoute extends Route {
  async model(params) {
    // params.backend
    const parentModel = this.modelFor('vault.cluster.secrets.custom');
    const { itempath, item } = params;
    // itempath is the key of the openApi item,
    // item is the user-input query param
    let queryUrl = `/v1/${parentModel.backend}`;
    const info = parentModel.pathInfo[itempath];
    console.log({ info });

    // If param required on info, use path
    const requiredParam = info.parameters?.find(p => p.required === true && p.in === 'path');
    if (requiredParam) {
      const reg = /\{.*\}/;
      console.log(reg);
      queryUrl = `${queryUrl}${info.urlPath.replace(reg, item)}`;
    } else {
      const reg = /\{.*\}/;
      queryUrl = `${queryUrl}${info.urlPath.replace(reg, '')}${info.listable ? '?list=true' : ''}`;
    }

    // possible views: list, get, create (form)

    let json;
    try {
      const resp = await fetch(queryUrl, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Vault-Token': 'root',
        },
      });
      json = await resp.json();
    } catch (e) {
      json = {
        data: null,
      };
    }
    console.log(json, 'JSON');
    // const tabs = json.openapi?.paths || {};
    // let tabsArray = [];
    // Object.keys(tabs).forEach(key => {
    //   if (tabs[key]?.get) {
    //     tabsArray.push(key);
    //   }
    // });
    return {
      path: queryUrl,
      info,
      data: json.data,
      list: json.data?.keys,
    };
  }
}