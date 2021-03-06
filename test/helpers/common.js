module.exports = {
  appkey: '7384d85615237469c2f6022a154b7e2c',
  buildGetParams: function (path, params) {
    let str_params = path;
    for (let key in params) { str_params += `${(str_params == path) ? "?" : "&"}${key}=${params[key]}`; }
    return str_params;
  },
  getMomentInTime: function (date) {
    const today = new Date();
    if (date > today) { return 1; }
    if (date < today) { return -1; }
    return 0;
  }
};
