var Ns = Object.defineProperty;
var Bs = (o, e, t) => e in o ? Ns(o, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : o[e] = t;
var R = (o, e, t) => Bs(o, typeof e != "symbol" ? e + "" : e, t);
class ie {
  constructor(e) {
    this.table = e;
  }
  //////////////////////////////////////////
  /////////////// DataLoad /////////////////
  //////////////////////////////////////////
  reloadData(e, t, i) {
    return this.table.dataLoader.load(e, void 0, void 0, void 0, t, i);
  }
  //////////////////////////////////////////
  ///////////// Localization ///////////////
  //////////////////////////////////////////
  langText() {
    return this.table.modules.localize.getText(...arguments);
  }
  langBind() {
    return this.table.modules.localize.bind(...arguments);
  }
  langLocale() {
    return this.table.modules.localize.getLocale(...arguments);
  }
  //////////////////////////////////////////
  ////////// Inter Table Comms /////////////
  //////////////////////////////////////////
  commsConnections() {
    return this.table.modules.comms.getConnections(...arguments);
  }
  commsSend() {
    return this.table.modules.comms.send(...arguments);
  }
  //////////////////////////////////////////
  //////////////// Layout  /////////////////
  //////////////////////////////////////////
  /** @returns {("fitData" | "fitDataFill" | "fitDataTable" | "fitDataStretch" | "fitColumns")} */
  layoutMode() {
    return this.table.modules.layout.getMode();
  }
  layoutRefresh(e) {
    return this.table.modules.layout.layout(e);
  }
  //////////////////////////////////////////
  /////////////// Event Bus ////////////////
  //////////////////////////////////////////
  subscribe() {
    return this.table.eventBus.subscribe(...arguments);
  }
  unsubscribe() {
    return this.table.eventBus.unsubscribe(...arguments);
  }
  subscribed(e) {
    return this.table.eventBus.subscribed(e);
  }
  subscriptionChange() {
    return this.table.eventBus.subscriptionChange(...arguments);
  }
  dispatch() {
    return this.table.eventBus.dispatch(...arguments);
  }
  chain() {
    return this.table.eventBus.chain(...arguments);
  }
  confirm() {
    return this.table.eventBus.confirm(...arguments);
  }
  dispatchExternal() {
    return this.table.externalEvents.dispatch(...arguments);
  }
  subscribedExternal(e) {
    return this.table.externalEvents.subscribed(e);
  }
  subscriptionChangeExternal() {
    return this.table.externalEvents.subscriptionChange(...arguments);
  }
  //////////////////////////////////////////
  //////////////// Options /////////////////
  //////////////////////////////////////////
  options(e) {
    return this.table.options[e];
  }
  setOption(e, t) {
    return typeof t < "u" && (this.table.options[e] = t), this.table.options[e];
  }
  //////////////////////////////////////////
  /////////// Deprecation Checks ///////////
  //////////////////////////////////////////
  deprecationCheck(e, t, i) {
    return this.table.deprecationAdvisor.check(e, t, i);
  }
  deprecationCheckMsg(e, t) {
    return this.table.deprecationAdvisor.checkMsg(e, t);
  }
  deprecationMsg(e) {
    return this.table.deprecationAdvisor.msg(e);
  }
  //////////////////////////////////////////
  //////////////// Modules /////////////////
  //////////////////////////////////////////
  module(e) {
    return this.table.module(e);
  }
}
class K {
  static elVisible(e) {
    return !(e.offsetWidth <= 0 && e.offsetHeight <= 0);
  }
  static elOffset(e) {
    var t = e.getBoundingClientRect();
    return {
      top: t.top + window.pageYOffset - document.documentElement.clientTop,
      left: t.left + window.pageXOffset - document.documentElement.clientLeft
    };
  }
  static retrieveNestedData(e, t, i) {
    var s = e ? t.split(e) : [t], n = s.length, r;
    for (let a = 0; a < n && (i = i[s[a]], r = i, !!i); a++)
      ;
    return r;
  }
  static deepClone(e, t, i = []) {
    var s = {}.__proto__, n = [].__proto__;
    t || (t = Object.assign(Array.isArray(e) ? [] : {}, e));
    for (var r in e) {
      let a = e[r], l, h;
      a != null && typeof a == "object" && (a.__proto__ === s || a.__proto__ === n) && (l = i.findIndex((d) => d.subject === a), l > -1 ? t[r] = i[l].copy : (h = Object.assign(Array.isArray(a) ? [] : {}, a), i.unshift({ subject: a, copy: h }), t[r] = this.deepClone(a, h, i)));
    }
    return t;
  }
}
let Is = class Gi extends ie {
  constructor(e, t, i) {
    super(e), this.element = t, this.container = this._lookupContainer(), this.parent = i, this.reversedX = !1, this.childPopup = null, this.blurable = !1, this.blurCallback = null, this.blurEventsBound = !1, this.renderedCallback = null, this.offset = {
      top: null,
      right: null,
      bottom: null,
      left: null
    }, this.visible = !1, this.hideable = !0, this.element.classList.add("tabulator-popup-container"), this.blurEvent = this.hide.bind(this, !1), this.escEvent = this._escapeCheck.bind(this), this.destroyBinding = this.tableDestroyed.bind(this), this.destroyed = !1;
  }
  tableDestroyed() {
    this.destroyed = !0, this.hide(!0);
  }
  _lookupContainer() {
    var e = this.table.options.popupContainer;
    return typeof e == "string" ? (e = document.querySelector(e), e || console.warn("Menu Error - no container element found matching selector:", this.table.options.popupContainer, "(defaulting to document body)")) : e === !0 && (e = this.table.element), e && !this._checkContainerIsParent(e) && (e = !1, console.warn("Menu Error - container element does not contain this table:", this.table.options.popupContainer, "(defaulting to document body)")), e || (e = document.body), e;
  }
  _checkContainerIsParent(e, t = this.table.element) {
    return e === t ? !0 : t.parentNode ? this._checkContainerIsParent(e, t.parentNode) : !1;
  }
  renderCallback(e) {
    this.renderedCallback = e;
  }
  containerEventCoords(e) {
    var t = !(e instanceof MouseEvent), i = t ? e.touches[0].pageX : e.pageX, s = t ? e.touches[0].pageY : e.pageY;
    if (this.container !== document.body) {
      let n = K.elOffset(this.container);
      i -= n.left, s -= n.top;
    }
    return { x: i, y: s };
  }
  elementPositionCoords(e, t = "right") {
    var i = K.elOffset(e), s, n, r;
    switch (this.container !== document.body && (s = K.elOffset(this.container), i.left -= s.left, i.top -= s.top), t) {
      case "right":
        n = i.left + e.offsetWidth, r = i.top - 1;
        break;
      case "bottom":
        n = i.left, r = i.top + e.offsetHeight;
        break;
      case "left":
        n = i.left, r = i.top - 1;
        break;
      case "top":
        n = i.left, r = i.top;
        break;
      case "center":
        n = i.left + e.offsetWidth / 2, r = i.top + e.offsetHeight / 2;
        break;
    }
    return { x: n, y: r, offset: i };
  }
  show(e, t) {
    var i, s;
    if (this.destroyed || this.table.destroyed)
      return this;
    this.parent || (this.reversedX = !1), e instanceof HTMLElement ? (i = e, s = this.elementPositionCoords(e, t).offset) : typeof e == "number" && (s = { top: 0, left: 0 });
    const n = this.resolveCoordsByOrigin(e, t);
    return this.offset.top = n.y, this.offset.left = n.x, this.offset.right = null, this.applyOffset(), this.container.appendChild(this.element), typeof this.renderedCallback == "function" && this.renderedCallback(), this._fitToScreen(n.x, n.y, i, s, t), this.visible = !0, this.subscribe("table-destroy", this.destroyBinding), this.element.addEventListener("mousedown", (r) => {
      r.stopPropagation();
    }), this;
  }
  resolveCoordsByOrigin(e, t) {
    if (e instanceof HTMLElement) {
      const i = this.elementPositionCoords(e, t);
      return { x: i.x, y: i.y };
    }
    return typeof e == "number" ? { x: e, y: t } : this.containerEventCoords(e);
  }
  _elementWidth() {
    return this.element.getBoundingClientRect().width || this.element.offsetWidth;
  }
  _elementHeight() {
    return this.element.getBoundingClientRect().height || this.element.offsetHeight;
  }
  _fitToScreen(e, t, i, s, n) {
    var r = this.container === document.body ? document.documentElement.scrollTop : this.container.scrollTop, a = this.container === document.body ? document.documentElement.scrollLeft : this.container.scrollLeft, l = this.container === document.body ? a : 0, h = this.container === document.body ? a + document.documentElement.clientWidth : this.container.offsetWidth, d = this.container === document.body ? r : 0, c = this.container === document.body ? r + document.documentElement.clientHeight : Math.max(this.container.offsetHeight, r ? this.container.scrollHeight : 0), u = this._elementWidth(), f = e;
    if ((f + u > h || this.reversedX) && (i && n === "right" ? f = s.left - u : i && n === "left" ? f = s.left + i.offsetWidth : i ? f = s.left - u : f = h - u, this.reversedX = !0), f + u > h && (f = h - u), f < l && (f = l), this.offset.left = f, this.offset.right = null, t + this._elementHeight() > c)
      if (i)
        switch (n) {
          case "bottom":
            this.offset.top = this.offset.top - this._elementHeight() - i.offsetHeight - 1;
            break;
          default:
            this.offset.top = this.offset.top - this._elementHeight() + i.offsetHeight + 1;
        }
      else {
        let m = this._elementHeight();
        if (m > c - d)
          this.offset.top = d, this.element.style.height = c - d + "px";
        else {
          let p = t - m;
          p < d && (p = c - m), this.offset.top = p;
        }
      }
    this.offset.top + this._elementHeight() > c && (this.offset.top = c - this._elementHeight()), this.offset.top < d && (this.offset.top = d), this.applyOffset();
  }
  applyOffset() {
    this.element.style.top = this.offset.top == null ? "" : this.offset.top + "px", this.element.style.right = this.offset.right == null ? "" : this.offset.right + "px", this.element.style.bottom = this.offset.bottom == null ? "" : this.offset.bottom + "px", this.element.style.left = this.offset.left == null ? "" : this.offset.left + "px";
  }
  isVisible() {
    return this.visible;
  }
  hideOnBlur(e) {
    return this.blurable = !0, this.visible && (setTimeout(() => {
      this.visible && (this.table.rowManager.element.addEventListener("scroll", this.blurEvent), this.subscribe("cell-editing", this.blurEvent), document.body.addEventListener("click", this.blurEvent), document.body.addEventListener("contextmenu", this.blurEvent), document.body.addEventListener("mousedown", this.blurEvent), window.addEventListener("resize", this.blurEvent), document.body.addEventListener("keydown", this.escEvent), this.blurEventsBound = !0);
    }, 100), this.blurCallback = e), this;
  }
  /** @param {KeyboardEvent} e */
  _escapeCheck(e) {
    e.key == 27 && this.hide();
  }
  blockHide() {
    this.hideable = !1;
  }
  restoreHide() {
    this.hideable = !0;
  }
  hide(e = !1) {
    return this.visible && this.hideable && (this.blurable && this.blurEventsBound && (document.body.removeEventListener("keydown", this.escEvent), document.body.removeEventListener("click", this.blurEvent), document.body.removeEventListener("contextmenu", this.blurEvent), document.body.removeEventListener("mousedown", this.blurEvent), window.removeEventListener("resize", this.blurEvent), this.table.rowManager.element.removeEventListener("scroll", this.blurEvent), this.unsubscribe("cell-editing", this.blurEvent), this.blurEventsBound = !1), this.childPopup && this.childPopup.hide(), this.parent && (this.parent.childPopup = null), this.element.parentNode && this.element.parentNode.removeChild(this.element), this.visible = !1, this.blurCallback && !e && this.blurCallback(), this.unsubscribe("table-destroy", this.destroyBinding)), this;
  }
  child(e) {
    return this.childPopup && this.childPopup.hide(), this.childPopup = new Gi(this.table, e, this), this.childPopup;
  }
};
class B extends ie {
  constructor(e, t) {
    super(e), this._handler = null;
  }
  initialize() {
  }
  ///////////////////////////////////
  ////// Options Registration ///////
  ///////////////////////////////////
  registerTableOption(e, t) {
    this.table.optionsList.register(e, t);
  }
  registerColumnOption(e, t) {
    this.table.columnManager.optionsList.register(e, t);
  }
  ///////////////////////////////////
  /// Public Function Registration ///
  ///////////////////////////////////
  registerTableFunction(e, t) {
    typeof this.table[e] > "u" ? this.table[e] = (...i) => (this.table.initGuard(e), t(...i)) : console.warn("Unable to bind table function, name already in use", e);
  }
  registerComponentFunction(e, t, i) {
    return this.table.componentFunctionBinder.bind(e, t, i);
  }
  ///////////////////////////////////
  ////////// Data Pipeline //////////
  ///////////////////////////////////
  registerDataHandler(e, t) {
    this.table.rowManager.registerDataPipelineHandler(e, t), this._handler = e;
  }
  registerDisplayHandler(e, t) {
    this.table.rowManager.registerDisplayPipelineHandler(e, t), this._handler = e;
  }
  displayRows(e) {
    var t = this.table.rowManager.displayRows.length - 1, i;
    if (this._handler && (i = this.table.rowManager.displayPipeline.findIndex((s) => s.handler === this._handler), i > -1 && (t = i)), e && (t = t + e), this._handler)
      return t > -1 ? this.table.rowManager.getDisplayRows(t) : this.activeRows();
  }
  activeRows() {
    return this.table.rowManager.activeRows;
  }
  refreshData(e, t) {
    t || (t = this._handler), t && this.table.rowManager.refreshActiveData(t, !1, e);
  }
  ///////////////////////////////////
  //////// Footer Management ////////
  ///////////////////////////////////
  footerAppend(e) {
    return this.table.footerManager.append(e);
  }
  footerPrepend(e) {
    return this.table.footerManager.prepend(e);
  }
  footerRemove(e) {
    return this.table.footerManager.remove(e);
  }
  ///////////////////////////////////
  //////// Popups Management ////////
  ///////////////////////////////////
  popup(e, t) {
    return new Is(this.table, e, t);
  }
  ///////////////////////////////////
  //////// Alert Management ////////
  ///////////////////////////////////
  alert(e, t) {
    return this.table.alertManager.alert(e, t);
  }
  clearAlert() {
    return this.table.alertManager.clear();
  }
}
var Vs = {
  rownum: function(o, e, t, i, s, n) {
    return n.getPosition();
  }
};
const Xe = class Xe extends B {
  constructor(e) {
    super(e), this.allowedTypes = ["", "data", "download", "clipboard", "print", "htmlOutput"], this.registerColumnOption("accessor"), this.registerColumnOption("accessorParams"), this.registerColumnOption("accessorData"), this.registerColumnOption("accessorDataParams"), this.registerColumnOption("accessorDownload"), this.registerColumnOption("accessorDownloadParams"), this.registerColumnOption("accessorClipboard"), this.registerColumnOption("accessorClipboardParams"), this.registerColumnOption("accessorPrint"), this.registerColumnOption("accessorPrintParams"), this.registerColumnOption("accessorHtmlOutput"), this.registerColumnOption("accessorHtmlOutputParams");
  }
  initialize() {
    this.subscribe("column-layout", this.initializeColumn.bind(this)), this.subscribe("row-data-retrieve", this.transformRow.bind(this));
  }
  //initialize column accessor
  initializeColumn(e) {
    var t = !1, i = {};
    this.allowedTypes.forEach((s) => {
      var n = "accessor" + (s.charAt(0).toUpperCase() + s.slice(1)), r;
      e.definition[n] && (r = this.lookupAccessor(e.definition[n]), r && (t = !0, i[n] = {
        accessor: r,
        params: e.definition[n + "Params"] || {}
      }));
    }), t && (e.modules.accessor = i);
  }
  lookupAccessor(e) {
    var t = !1;
    switch (typeof e) {
      case "string":
        Xe.accessors[e] ? t = Xe.accessors[e] : console.warn("Accessor Error - No such accessor found, ignoring: ", e);
        break;
      case "function":
        t = e;
        break;
    }
    return t;
  }
  //apply accessor to row
  transformRow(e, t) {
    var i = "accessor" + (t.charAt(0).toUpperCase() + t.slice(1)), s = e.getComponent(), n = K.deepClone(e.data || {});
    return this.table.columnManager.traverse(function(r) {
      var a, l, h, d;
      r.modules.accessor && (l = r.modules.accessor[i] || r.modules.accessor.accessor || !1, l && (a = r.getFieldValue(n), a != "undefined" && (d = r.getComponent(), h = typeof l.params == "function" ? l.params(a, n, t, d, s) : l.params, r.setFieldValue(n, l.accessor(a, n, t, h, d, s)))));
    }), n;
  }
};
R(Xe, "moduleName", "accessor"), //load defaults
R(Xe, "accessors", Vs);
let Ut = Xe;
var Ws = {
  method: "GET"
};
function $t(o, e) {
  var t = [];
  if (e = e || "", Array.isArray(o))
    o.forEach((s, n) => {
      t = t.concat($t(s, e ? e + "[" + n + "]" : n));
    });
  else if (typeof o == "object")
    for (var i in o)
      t = t.concat($t(o[i], e ? e + "[" + i + "]" : i));
  else
    t.push({ key: e, value: o });
  return t;
}
function js(o) {
  var e = $t(o), t = [];
  return e.forEach(function(i) {
    t.push(encodeURIComponent(i.key) + "=" + encodeURIComponent(i.value));
  }), t.join("&");
}
function Ui(o, e, t) {
  return o && t && Object.keys(t).length && (!e.method || e.method.toLowerCase() == "get") && (e.method = "get", o += (o.includes("?") ? "&" : "?") + js(t)), o;
}
function Gs(o, e, t) {
  var i;
  return new Promise((s, n) => {
    if (o = this.urlGenerator.call(this.table, o, e, t), e.method.toUpperCase() != "GET")
      if (i = typeof this.table.options.ajaxContentType == "object" ? this.table.options.ajaxContentType : this.contentTypeFormatters[this.table.options.ajaxContentType], i) {
        for (var r in i.headers)
          e.headers || (e.headers = {}), typeof e.headers[r] > "u" && (e.headers[r] = i.headers[r]);
        e.body = i.body.call(this, o, e, t);
      } else
        console.warn("Ajax Error - Invalid ajaxContentType value:", this.table.options.ajaxContentType);
    o ? (typeof e.headers > "u" && (e.headers = {}), typeof e.headers.Accept > "u" && (e.headers.Accept = "application/json"), typeof e.headers["X-Requested-With"] > "u" && (e.headers["X-Requested-With"] = "XMLHttpRequest"), typeof e.mode > "u" && (e.mode = "cors"), e.mode == "cors" ? (typeof e.headers.Origin > "u" && (e.headers.Origin = window.location.origin), typeof e.credentials > "u" && (e.credentials = "same-origin")) : typeof e.credentials > "u" && (e.credentials = "include"), fetch(o, e).then((a) => {
      a.ok ? a.json().then((l) => {
        s(l);
      }).catch((l) => {
        n(l), console.warn("Ajax Load Error - Invalid JSON returned", l);
      }) : (console.error("Ajax Load Error - Connection Error: " + a.status, a.statusText), n(a));
    }).catch((a) => {
      console.error("Ajax Load Error - Connection Error: ", a), n(a);
    })) : (console.warn("Ajax Load Error - No URL Set"), s([]));
  });
}
function qt(o, e) {
  var t = [];
  if (e = e || "", Array.isArray(o))
    o.forEach((s, n) => {
      t = t.concat(qt(s, e ? e + "[" + n + "]" : n));
    });
  else if (typeof o == "object")
    for (var i in o)
      t = t.concat(qt(o[i], e ? e + "[" + i + "]" : i));
  else
    t.push({ key: e, value: o });
  return t;
}
var Us = {
  json: {
    headers: {
      "Content-Type": "application/json"
    },
    body: function(o, e, t) {
      return JSON.stringify(t);
    }
  },
  form: {
    headers: {},
    body: function(o, e, t) {
      var i = qt(t), s = new FormData();
      return i.forEach(function(n) {
        s.append(n.key, n.value);
      }), s;
    }
  }
};
const pe = class pe extends B {
  constructor(e) {
    super(e), this.config = {}, this.url = "", this.urlGenerator = !1, this.params = !1, this.loaderPromise = !1, this.registerTableOption("ajaxURL", !1), this.registerTableOption("ajaxURLGenerator", !1), this.registerTableOption("ajaxParams", {}), this.registerTableOption("ajaxConfig", "get"), this.registerTableOption("ajaxContentType", "form"), this.registerTableOption("ajaxRequestFunc", !1), this.registerTableOption("ajaxRequesting", function() {
    }), this.registerTableOption("ajaxResponse", !1), this.contentTypeFormatters = pe.contentTypeFormatters;
  }
  //initialize setup options
  initialize() {
    this.loaderPromise = this.table.options.ajaxRequestFunc || pe.defaultLoaderPromise, this.urlGenerator = this.table.options.ajaxURLGenerator || pe.defaultURLGenerator, this.table.options.ajaxURL && this.setUrl(this.table.options.ajaxURL), this.setDefaultConfig(this.table.options.ajaxConfig), this.registerTableFunction("getAjaxUrl", this.getUrl.bind(this)), this.subscribe("data-loading", this.requestDataCheck.bind(this)), this.subscribe("data-params", this.requestParams.bind(this)), this.subscribe("data-load", this.requestData.bind(this));
  }
  requestParams(e, t, i, s) {
    var n = this.table.options.ajaxParams;
    return n && (typeof n == "function" && (n = n.call(this.table)), s = Object.assign(Object.assign({}, n), s)), s;
  }
  requestDataCheck(e, t, i, s) {
    return !!(!e && this.url || typeof e == "string");
  }
  requestData(e, t, i, s, n) {
    var r;
    return !n && this.requestDataCheck(e) ? (e && this.setUrl(e), r = this.generateConfig(i), this.sendRequest(this.url, t, r)) : n;
  }
  setDefaultConfig(e = {}) {
    this.config = Object.assign({}, pe.defaultConfig), typeof e == "string" ? this.config.method = e : Object.assign(this.config, e);
  }
  //load config object
  generateConfig(e = {}) {
    var t = Object.assign({}, this.config);
    return typeof e == "string" ? t.method = e : Object.assign(t, e), t;
  }
  //set request url
  setUrl(e) {
    this.url = e;
  }
  //get request url
  getUrl() {
    return this.url;
  }
  //send ajax request
  sendRequest(e, t, i) {
    return this.table.options.ajaxRequesting.call(this.table, e, t) !== !1 ? this.loaderPromise(e, i, t).then((s) => (this.table.options.ajaxResponse && (s = this.table.options.ajaxResponse.call(this.table, e, t, s)), s)) : Promise.reject();
  }
};
R(pe, "moduleName", "ajax"), //load defaults
R(pe, "defaultConfig", Ws), R(pe, "defaultURLGenerator", Ui), R(pe, "defaultLoaderPromise", Gs), R(pe, "contentTypeFormatters", Us);
let Kt = pe;
var $s = {
  replace: function(o) {
    return this.table.setData(o);
  },
  update: function(o) {
    return this.table.updateOrAddData(o);
  },
  insert: function(o) {
    return this.table.addData(o);
  }
}, qs = {
  table: function(o) {
    var e = [], t = !0, i = this.table.columnManager.columns, s = [], n = [];
    return o = o.split(`
`), o.forEach(function(r) {
      e.push(r.split("	"));
    }), e.length && !(e.length === 1 && e[0].length < 2) ? (e[0].forEach(function(r) {
      var a = i.find(function(l) {
        return r && l.definition.title && r.trim() && l.definition.title.trim() === r.trim();
      });
      a ? s.push(a) : t = !1;
    }), t || (t = !0, s = [], e[0].forEach(function(r) {
      var a = i.find(function(l) {
        return r && l.field && r.trim() && l.field.trim() === r.trim();
      });
      a ? s.push(a) : t = !1;
    }), t || (s = this.table.columnManager.columnsByIndex)), t && e.shift(), e.forEach(function(r) {
      var a = {};
      r.forEach(function(l, h) {
        s[h] && (a[s[h].field] = l);
      }), n.push(a);
    }), n) : !1;
  }
}, Ks = {
  copyToClipboard: ["ctrl + 67", "meta + 67"]
}, Js = {
  copyToClipboard: function(o) {
    this.table.modules.edit.currentCell || this.table.modExists("clipboard", !0) && this.table.modules.clipboard.copy(!1, !0);
  }
}, Xs = {
  keybindings: {
    bindings: Ks,
    actions: Js
  }
};
const Se = class Se extends B {
  constructor(e) {
    super(e), this.mode = !0, this.pasteParser = function() {
    }, this.pasteAction = function() {
    }, this.customSelection = !1, this.rowRange = !1, this.blocked = !0, this.registerTableOption("clipboard", !1), this.registerTableOption("clipboardCopyStyled", !0), this.registerTableOption("clipboardCopyConfig", !1), this.registerTableOption("clipboardCopyFormatter", !1), this.registerTableOption("clipboardCopyRowRange", "active"), this.registerTableOption("clipboardPasteParser", "table"), this.registerTableOption("clipboardPasteAction", "insert"), this.registerColumnOption("clipboard"), this.registerColumnOption("titleClipboard");
  }
  initialize() {
    this.mode = this.table.options.clipboard, this.rowRange = this.table.options.clipboardCopyRowRange, (this.mode === !0 || this.mode === "copy") && this.table.element.addEventListener("copy", (e) => {
      var t, i, s;
      this.blocked || (e.preventDefault(), this.customSelection ? (t = this.customSelection, this.table.options.clipboardCopyFormatter && (t = this.table.options.clipboardCopyFormatter("plain", t))) : (s = this.table.modules.export.generateExportList(this.table.options.clipboardCopyConfig, this.table.options.clipboardCopyStyled, this.rowRange, "clipboard"), i = this.table.modules.export.generateHTMLTable(s), t = i ? this.generatePlainContent(s) : "", this.table.options.clipboardCopyFormatter && (t = this.table.options.clipboardCopyFormatter("plain", t), i = this.table.options.clipboardCopyFormatter("html", i))), window.clipboardData && window.clipboardData.setData ? window.clipboardData.setData("Text", t) : e.clipboardData && e.clipboardData.setData ? (e.clipboardData.setData("text/plain", t), i && e.clipboardData.setData("text/html", i)) : e.originalEvent && e.originalEvent.clipboardData.setData && (e.originalEvent.clipboardData.setData("text/plain", t), i && e.originalEvent.clipboardData.setData("text/html", i)), this.dispatchExternal("clipboardCopied", t, i), this.reset());
    }), (this.mode === !0 || this.mode === "paste") && this.table.element.addEventListener("paste", (e) => {
      this.paste(e);
    }), this.setPasteParser(this.table.options.clipboardPasteParser), this.setPasteAction(this.table.options.clipboardPasteAction), this.registerTableFunction("copyToClipboard", this.copy.bind(this));
  }
  reset() {
    this.blocked = !0, this.customSelection = !1;
  }
  generatePlainContent(e) {
    var t = [];
    return e.forEach((i) => {
      var s = [];
      i.columns.forEach((n) => {
        var r = "";
        if (n)
          if (i.type === "group" && (n.value = n.component.getKey()), n.value === null)
            r = "";
          else
            switch (typeof n.value) {
              case "object":
                r = JSON.stringify(n.value);
                break;
              case "undefined":
                r = "";
                break;
              default:
                r = n.value;
            }
        s.push(r);
      }), t.push(s.join("	"));
    }), t.join(`
`);
  }
  copy(e, t) {
    var i, s;
    this.blocked = !1, this.customSelection = !1, (this.mode === !0 || this.mode === "copy") && (this.rowRange = e || this.table.options.clipboardCopyRowRange, typeof window.getSelection < "u" && typeof document.createRange < "u" ? (e = document.createRange(), e.selectNodeContents(this.table.element), i = window.getSelection(), i.toString() && t && (this.customSelection = i.toString()), i.removeAllRanges(), i.addRange(e)) : typeof document.selection < "u" && typeof document.body.createTextRange < "u" && (s = document.body.createTextRange(), s.moveToElementText(this.table.element), s.select()), document.execCommand("copy"), i && i.removeAllRanges());
  }
  //PASTE EVENT HANDLING
  setPasteAction(e) {
    switch (typeof e) {
      case "string":
        this.pasteAction = Se.pasteActions[e], this.pasteAction || console.warn("Clipboard Error - No such paste action found:", e);
        break;
      case "function":
        this.pasteAction = e;
        break;
    }
  }
  setPasteParser(e) {
    switch (typeof e) {
      case "string":
        this.pasteParser = Se.pasteParsers[e], this.pasteParser || console.warn("Clipboard Error - No such paste parser found:", e);
        break;
      case "function":
        this.pasteParser = e;
        break;
    }
  }
  paste(e) {
    var t, i, s;
    this.checkPasteOrigin(e) && (t = this.getPasteData(e), i = this.pasteParser.call(this, t), i ? (e.preventDefault(), this.table.modExists("mutator") && (i = this.mutateData(i)), s = this.pasteAction.call(this, i), this.dispatchExternal("clipboardPasted", t, i, s)) : this.dispatchExternal("clipboardPasteError", t));
  }
  mutateData(e) {
    var t = [];
    return Array.isArray(e) ? e.forEach((i) => {
      t.push(this.table.modules.mutator.transformRow(i, "clipboard"));
    }) : t = e, t;
  }
  checkPasteOrigin(e) {
    var t = !0, i = this.confirm("clipboard-paste", [e]);
    return (i || !["DIV", "SPAN"].includes(e.target.tagName)) && (t = !1), t;
  }
  getPasteData(e) {
    var t;
    return window.clipboardData && window.clipboardData.getData ? t = window.clipboardData.getData("Text") : e.clipboardData && e.clipboardData.getData ? t = e.clipboardData.getData("text/plain") : e.originalEvent && e.originalEvent.clipboardData.getData && (t = e.originalEvent.clipboardData.getData("text/plain")), t;
  }
};
R(Se, "moduleName", "clipboard"), R(Se, "moduleExtensions", Xs), //load defaults
R(Se, "pasteActions", $s), R(Se, "pasteParsers", qs);
let Jt = Se;
class Ys {
  constructor(e) {
    return this._row = e, new Proxy(this, {
      get: function(t, i, s) {
        return typeof t[i] < "u" ? t[i] : t._row.table.componentFunctionBinder.handle("row", t._row, i);
      }
    });
  }
  getData(e) {
    return this._row.getData(e);
  }
  getElement() {
    return this._row.getElement();
  }
  getTable() {
    return this._row.table;
  }
  getCells() {
    var e = [];
    return this._row.getCells().forEach(function(t) {
      e.push(t.getComponent());
    }), e;
  }
  getCell(e) {
    var t = this._row.getCell(e);
    return t ? t.getComponent() : !1;
  }
  _getSelf() {
    return this._row;
  }
}
class $i {
  constructor(e) {
    return this._cell = e, new Proxy(this, {
      get: function(t, i, s) {
        return typeof t[i] < "u" ? t[i] : t._cell.table.componentFunctionBinder.handle("cell", t._cell, i);
      }
    });
  }
  getValue() {
    return this._cell.getValue();
  }
  getOldValue() {
    return this._cell.getOldValue();
  }
  getInitialValue() {
    return this._cell.initialValue;
  }
  getElement() {
    return this._cell.getElement();
  }
  getRow() {
    return this._cell.row.getComponent();
  }
  getData(e) {
    return this._cell.row.getData(e);
  }
  getType() {
    return "cell";
  }
  getField() {
    return this._cell.column.getField();
  }
  getColumn() {
    return this._cell.column.getComponent();
  }
  setValue(e, t) {
    typeof t > "u" && (t = !0), this._cell.setValue(e, t);
  }
  restoreOldValue() {
    this._cell.setValueActual(this._cell.getOldValue());
  }
  restoreInitialValue() {
    this._cell.setValueActual(this._cell.initialValue);
  }
  checkHeight() {
    this._cell.checkHeight();
  }
  getTable() {
    return this._cell.table;
  }
  _getSelf() {
    return this._cell;
  }
}
class ft extends ie {
  constructor(e, t) {
    super(e.table), this.table = e.table, this.column = e, this.row = t, this.element = null, this.value = null, this.initialValue, this.oldValue = null, this.modules = {}, this.height = null, this.width = null, this.minWidth = null, this.component = null, this.loaded = !1, this.build();
  }
  //////////////// Setup Functions /////////////////
  //generate element
  build() {
    this.generateElement(), this.setWidth(), this._configureCell(), this.setValueActual(this.column.getFieldValue(this.row.data)), this.initialValue = this.value;
  }
  generateElement() {
    this.element = document.createElement("div"), this.element.className = "tabulator-cell", this.element.setAttribute("role", "gridcell"), this.column.isRowHeader && this.element.classList.add("tabulator-row-header");
  }
  _configureCell() {
    var e = this.element, t = this.column.getField(), i = {
      top: "flex-start",
      bottom: "flex-end",
      middle: "center"
    }, s = {
      left: "flex-start",
      right: "flex-end",
      center: "center"
    };
    if (e.style.textAlign = this.column.hozAlign, this.column.vertAlign && (e.style.display = "inline-flex", e.style.alignItems = i[this.column.vertAlign] || "", this.column.hozAlign && (e.style.justifyContent = s[this.column.hozAlign] || "")), t && e.setAttribute("tabulator-field", t), this.column.definition.cssClass) {
      var n = this.column.definition.cssClass.split(" ");
      n.forEach((r) => {
        e.classList.add(r);
      });
    }
    this.dispatch("cell-init", this), this.column.visible || this.hide();
  }
  //generate cell contents
  _generateContents() {
    var e;
    switch (e = this.chain("cell-format", this, null, () => this.element.innerHTML = this.value), typeof e) {
      case "object":
        if (e instanceof Node) {
          for (; this.element.firstChild; ) this.element.removeChild(this.element.firstChild);
          this.element.appendChild(e);
        } else
          this.element.innerHTML = "", e != null && console.warn("Format Error - Formatter has returned a type of object, the only valid formatter object return is an instance of Node, the formatter returned:", e);
        break;
      case "undefined":
        this.element.innerHTML = "";
        break;
      default:
        this.element.innerHTML = e;
    }
  }
  cellRendered() {
    this.dispatch("cell-rendered", this);
  }
  //////////////////// Getters ////////////////////
  getElement(e) {
    return this.loaded || (this.loaded = !0, e || this.layoutElement()), this.element;
  }
  getValue() {
    return this.value;
  }
  getOldValue() {
    return this.oldValue;
  }
  //////////////////// Actions ////////////////////
  setValue(e, t, i) {
    var s = this.setValueProcessData(e, t, i);
    s && (this.dispatch("cell-value-updated", this), this.cellRendered(), this.column.definition.cellEdited && this.column.definition.cellEdited.call(this.table, this.getComponent()), this.dispatchExternal("cellEdited", this.getComponent()), this.subscribedExternal("dataChanged") && this.dispatchExternal("dataChanged", this.table.rowManager.getData()));
  }
  setValueProcessData(e, t, i) {
    var s = !1;
    return (this.value !== e || i) && (s = !0, t && (e = this.chain("cell-value-changing", [this, e], null, e))), this.setValueActual(e), s && this.dispatch("cell-value-changed", this), s;
  }
  setValueActual(e) {
    this.oldValue = this.value, this.value = e, this.dispatch("cell-value-save-before", this), this.column.setFieldValue(this.row.data, e), this.dispatch("cell-value-save-after", this), this.loaded && this.layoutElement();
  }
  layoutElement() {
    this._generateContents(), this.dispatch("cell-layout", this);
  }
  setWidth() {
    this.width = this.column.width, this.element.style.width = this.column.widthStyled;
  }
  clearWidth() {
    this.width = "", this.element.style.width = "";
  }
  getWidth() {
    return this.width || this.element.offsetWidth;
  }
  setMinWidth() {
    this.minWidth = this.column.minWidth, this.element.style.minWidth = this.column.minWidthStyled;
  }
  setMaxWidth() {
    this.maxWidth = this.column.maxWidth, this.element.style.maxWidth = this.column.maxWidthStyled;
  }
  checkHeight() {
    this.row.reinitializeHeight();
  }
  clearHeight() {
    this.element.style.height = "", this.height = null, this.dispatch("cell-height", this, "");
  }
  setHeight() {
    this.height = this.row.height, this.element.style.height = this.row.heightStyled, this.dispatch("cell-height", this, this.row.heightStyled);
  }
  getHeight() {
    return this.height || this.element.offsetHeight;
  }
  show() {
    this.element.style.display = this.column.vertAlign ? "inline-flex" : "";
  }
  hide() {
    this.element.style.display = "none";
  }
  delete() {
    this.dispatch("cell-delete", this), !this.table.rowManager.redrawBlock && this.element.parentNode && this.element.parentNode.removeChild(this.element), this.element = !1, this.column.deleteCell(this), this.row.deleteCell(this), this.calcs = {};
  }
  getIndex() {
    return this.row.getCellIndex(this);
  }
  //////////////// Object Generation /////////////////
  getComponent() {
    return this.component || (this.component = new $i(this)), this.component;
  }
}
class qi {
  constructor(e) {
    return this._column = e, this.type = "ColumnComponent", new Proxy(this, {
      get: function(t, i, s) {
        return typeof t[i] < "u" ? t[i] : t._column.table.componentFunctionBinder.handle("column", t._column, i);
      }
    });
  }
  getElement() {
    return this._column.getElement();
  }
  getDefinition() {
    return this._column.getDefinition();
  }
  getField() {
    return this._column.getField();
  }
  getTitleDownload() {
    return this._column.getTitleDownload();
  }
  getCells() {
    var e = [];
    return this._column.cells.forEach(function(t) {
      e.push(t.getComponent());
    }), e;
  }
  isVisible() {
    return this._column.visible;
  }
  show() {
    this._column.isGroup ? this._column.columns.forEach(function(e) {
      e.show();
    }) : this._column.show();
  }
  hide() {
    this._column.isGroup ? this._column.columns.forEach(function(e) {
      e.hide();
    }) : this._column.hide();
  }
  toggle() {
    this._column.visible ? this.hide() : this.show();
  }
  delete() {
    return this._column.delete();
  }
  getSubColumns() {
    var e = [];
    return this._column.columns.length && this._column.columns.forEach(function(t) {
      e.push(t.getComponent());
    }), e;
  }
  getParentColumn() {
    return this._column.getParentComponent();
  }
  _getSelf() {
    return this._column;
  }
  scrollTo(e, t) {
    return this._column.table.columnManager.scrollToColumn(this._column, e, t);
  }
  getTable() {
    return this._column.table;
  }
  move(e, t) {
    var i = this._column.table.columnManager.findColumn(e);
    i ? this._column.table.columnManager.moveColumn(this._column, i, t) : console.warn("Move Error - No matching column found:", i);
  }
  getNextColumn() {
    var e = this._column.nextColumn();
    return e ? e.getComponent() : !1;
  }
  getPrevColumn() {
    var e = this._column.prevColumn();
    return e ? e.getComponent() : !1;
  }
  updateDefinition(e) {
    return this._column.updateDefinition(e);
  }
  getWidth() {
    return this._column.getWidth();
  }
  setWidth(e) {
    var t;
    return e === !0 ? t = this._column.reinitializeWidth(!0) : t = this._column.setWidth(e), this._column.table.columnManager.rerenderColumns(!0), t;
  }
}
var Ki = {
  title: void 0,
  field: void 0,
  columns: void 0,
  visible: void 0,
  hozAlign: void 0,
  vertAlign: void 0,
  width: void 0,
  minWidth: 40,
  maxWidth: void 0,
  maxInitialWidth: void 0,
  cssClass: void 0,
  variableHeight: void 0,
  headerVertical: void 0,
  headerHozAlign: void 0,
  headerWordWrap: !1,
  editableTitle: void 0
};
const Ie = class Ie extends ie {
  constructor(e, t, i) {
    super(t.table), this.definition = e, this.parent = t, this.type = "column", this.columns = [], this.cells = [], this.isGroup = !1, this.isRowHeader = i, this.element = this.createElement(), this.contentElement = !1, this.titleHolderElement = !1, this.titleElement = !1, this.groupElement = this.createGroupElement(), this.hozAlign = "", this.vertAlign = "", this.field = "", this.fieldStructure = "", this.getFieldValue = "", this.setFieldValue = "", this.titleDownload = null, this.titleFormatterRendered = !1, this.mapDefinitions(), this.setField(this.definition.field), this.modules = {}, this.width = null, this.widthStyled = "", this.maxWidth = null, this.maxWidthStyled = "", this.maxInitialWidth = null, this.minWidth = null, this.minWidthStyled = "", this.widthFixed = !1, this.visible = !0, this.component = null, this.definition.columns ? (this.isGroup = !0, this.definition.columns.forEach((s, n) => {
      var r = new Ie(s, this);
      this.attachColumn(r);
    }), this.checkColumnVisibility()) : t.registerColumnField(this), this._initialize();
  }
  createElement() {
    var e = document.createElement("div");
    switch (e.classList.add("tabulator-col"), e.setAttribute("role", "columnheader"), e.setAttribute("aria-sort", "none"), this.isRowHeader && e.classList.add("tabulator-row-header"), this.table.options.columnHeaderVertAlign) {
      case "middle":
        e.style.justifyContent = "center";
        break;
      case "bottom":
        e.style.justifyContent = "flex-end";
        break;
    }
    return e;
  }
  createGroupElement() {
    var e = document.createElement("div");
    return e.classList.add("tabulator-col-group-cols"), e;
  }
  mapDefinitions() {
    var e = this.table.options.columnDefaults;
    if (e)
      for (let t in e)
        typeof this.definition[t] > "u" && (this.definition[t] = e[t]);
    this.definition = this.table.columnManager.optionsList.generate(Ie.defaultOptionList, this.definition);
  }
  checkDefinition() {
    Object.keys(this.definition).forEach((e) => {
      Ie.defaultOptionList.indexOf(e) === -1 && console.warn("Invalid column definition option in '" + (this.field || this.definition.title) + "' column:", e);
    });
  }
  setField(e) {
    this.field = e, this.fieldStructure = e ? this.table.options.nestedFieldSeparator ? e.split(this.table.options.nestedFieldSeparator) : [e] : [], this.getFieldValue = this.fieldStructure.length > 1 ? this._getNestedData : this._getFlatData, this.setFieldValue = this.fieldStructure.length > 1 ? this._setNestedData : this._setFlatData;
  }
  //register column position with column manager
  registerColumnPosition(e) {
    this.parent.registerColumnPosition(e);
  }
  //register column position with column manager
  registerColumnField(e) {
    this.parent.registerColumnField(e);
  }
  //trigger position registration
  reRegisterPosition() {
    this.isGroup ? this.columns.forEach(function(e) {
      e.reRegisterPosition();
    }) : this.registerColumnPosition(this);
  }
  //build header element
  _initialize() {
    for (var e = this.definition; this.element.firstChild; ) this.element.removeChild(this.element.firstChild);
    e.headerVertical && (this.element.classList.add("tabulator-col-vertical"), e.headerVertical === "flip" && this.element.classList.add("tabulator-col-vertical-flip")), this.contentElement = this._buildColumnHeaderContent(), this.element.appendChild(this.contentElement), this.isGroup ? this._buildGroupHeader() : this._buildColumnHeader(), this.dispatch("column-init", this);
  }
  //build header element for header
  _buildColumnHeader() {
    var e = this.definition;
    if (this.dispatch("column-layout", this), typeof e.visible < "u" && (e.visible ? this.show(!0) : this.hide(!0)), e.cssClass) {
      var t = e.cssClass.split(" ");
      t.forEach((i) => {
        this.element.classList.add(i);
      });
    }
    e.field && this.element.setAttribute("tabulator-field", e.field), this.setMinWidth(parseInt(e.minWidth)), e.maxInitialWidth && (this.maxInitialWidth = parseInt(e.maxInitialWidth)), e.maxWidth && this.setMaxWidth(parseInt(e.maxWidth)), this.reinitializeWidth(), this.hozAlign = this.definition.hozAlign, this.vertAlign = this.definition.vertAlign, this.titleElement.style.textAlign = this.definition.headerHozAlign;
  }
  _buildColumnHeaderContent() {
    var e = document.createElement("div");
    return e.classList.add("tabulator-col-content"), this.titleHolderElement = document.createElement("div"), this.titleHolderElement.classList.add("tabulator-col-title-holder"), e.appendChild(this.titleHolderElement), this.titleElement = this._buildColumnHeaderTitle(), this.titleHolderElement.appendChild(this.titleElement), e;
  }
  //build title element of column
  _buildColumnHeaderTitle() {
    var e = this.definition, t = document.createElement("div");
    if (t.classList.add("tabulator-col-title"), e.headerWordWrap && t.classList.add("tabulator-col-title-wrap"), e.editableTitle) {
      var i = document.createElement("input");
      i.classList.add("tabulator-title-editor"), i.addEventListener("click", (s) => {
        s.stopPropagation(), i.focus();
      }), i.addEventListener("mousedown", (s) => {
        s.stopPropagation();
      }), i.addEventListener("change", () => {
        e.title = i.value, this.dispatchExternal("columnTitleChanged", this.getComponent());
      }), t.appendChild(i), e.field ? this.langBind("columns|" + e.field, (s) => {
        i.value = s || e.title || "&nbsp;";
      }) : i.value = e.title || "&nbsp;";
    } else
      e.field ? this.langBind("columns|" + e.field, (s) => {
        this._formatColumnHeaderTitle(t, s || e.title || "&nbsp;");
      }) : this._formatColumnHeaderTitle(t, e.title || "&nbsp;");
    return t;
  }
  _formatColumnHeaderTitle(e, t) {
    var i = this.chain("column-format", [this, t, e], null, () => t);
    switch (typeof i) {
      case "object":
        i instanceof Node ? e.appendChild(i) : (e.innerHTML = "", console.warn("Format Error - Title formatter has returned a type of object, the only valid formatter object return is an instance of Node, the formatter returned:", i));
        break;
      case "undefined":
        e.innerHTML = "";
        break;
      default:
        e.innerHTML = i;
    }
  }
  //build header element for column group
  _buildGroupHeader() {
    if (this.element.classList.add("tabulator-col-group"), this.element.setAttribute("role", "columngroup"), this.element.setAttribute("aria-title", this.definition.title), this.definition.cssClass) {
      var e = this.definition.cssClass.split(" ");
      e.forEach((t) => {
        this.element.classList.add(t);
      });
    }
    this.titleElement.style.textAlign = this.definition.headerHozAlign, this.element.appendChild(this.groupElement);
  }
  //flat field lookup
  _getFlatData(e) {
    return e[this.field];
  }
  //nested field lookup
  _getNestedData(e) {
    var t = e, i = this.fieldStructure, s = i.length, n;
    for (let r = 0; r < s && (t = t[i[r]], n = t, !!t); r++)
      ;
    return n;
  }
  //flat field set
  _setFlatData(e, t) {
    this.field && (e[this.field] = t);
  }
  //nested field set
  _setNestedData(e, t) {
    var i = e, s = this.fieldStructure, n = s.length;
    for (let r = 0; r < n; r++)
      if (r == n - 1)
        i[s[r]] = t;
      else {
        if (!i[s[r]])
          if (typeof t < "u")
            i[s[r]] = {};
          else
            break;
        i = i[s[r]];
      }
  }
  //attach column to this group
  attachColumn(e) {
    this.groupElement ? (this.columns.push(e), this.groupElement.appendChild(e.getElement()), e.columnRendered()) : console.warn("Column Warning - Column being attached to another column instead of column group");
  }
  //vertically align header in column
  verticalAlign(e, t) {
    var i = this.parent.isGroup ? this.parent.getGroupElement().clientHeight : t || this.parent.getHeadersElement().clientHeight;
    this.element.style.height = i + "px", this.dispatch("column-height", this, this.element.style.height), this.isGroup && (this.groupElement.style.minHeight = i - this.contentElement.offsetHeight + "px"), this.columns.forEach(function(s) {
      s.verticalAlign(e);
    });
  }
  //clear vertical alignment
  clearVerticalAlign() {
    this.element.style.paddingTop = "", this.element.style.height = "", this.element.style.minHeight = "", this.groupElement.style.minHeight = "", this.columns.forEach(function(e) {
      e.clearVerticalAlign();
    }), this.dispatch("column-height", this, "");
  }
  //// Retrieve Column Information ////
  //return column header element
  getElement() {
    return this.element;
  }
  //return column group element
  getGroupElement() {
    return this.groupElement;
  }
  //return field name
  getField() {
    return this.field;
  }
  getTitleDownload() {
    return this.titleDownload;
  }
  //return the first column in a group
  getFirstColumn() {
    return this.isGroup ? this.columns.length ? this.columns[0].getFirstColumn() : !1 : this;
  }
  //return the last column in a group
  getLastColumn() {
    return this.isGroup ? this.columns.length ? this.columns[this.columns.length - 1].getLastColumn() : !1 : this;
  }
  //return all columns in a group
  getColumns(e) {
    var t = [];
    return e ? this.columns.forEach((i) => {
      t.push(i), t = t.concat(i.getColumns(!0));
    }) : t = this.columns, t;
  }
  //return all columns in a group
  getCells() {
    return this.cells;
  }
  //retrieve the top column in a group of columns
  getTopColumn() {
    return this.parent.isGroup ? this.parent.getTopColumn() : this;
  }
  //return column definition object
  getDefinition(e) {
    var t = [];
    return this.isGroup && e && (this.columns.forEach(function(i) {
      t.push(i.getDefinition(!0));
    }), this.definition.columns = t), this.definition;
  }
  //////////////////// Actions ////////////////////
  checkColumnVisibility() {
    var e = !1;
    this.columns.forEach(function(t) {
      t.visible && (e = !0);
    }), e ? (this.show(), this.dispatchExternal("columnVisibilityChanged", this.getComponent(), !1)) : this.hide();
  }
  //show column
  show(e, t) {
    this.visible || (this.visible = !0, this.element.style.display = "", this.parent.isGroup && this.parent.checkColumnVisibility(), this.cells.forEach(function(i) {
      i.show();
    }), !this.isGroup && this.width === null && this.reinitializeWidth(), this.table.columnManager.verticalAlignHeaders(), this.dispatch("column-show", this, t), e || this.dispatchExternal("columnVisibilityChanged", this.getComponent(), !0), this.parent.isGroup && this.parent.matchChildWidths(), this.silent || this.table.columnManager.rerenderColumns());
  }
  //hide column
  hide(e, t) {
    this.visible && (this.visible = !1, this.element.style.display = "none", this.table.columnManager.verticalAlignHeaders(), this.parent.isGroup && this.parent.checkColumnVisibility(), this.cells.forEach(function(i) {
      i.hide();
    }), this.dispatch("column-hide", this, t), e || this.dispatchExternal("columnVisibilityChanged", this.getComponent(), !1), this.parent.isGroup && this.parent.matchChildWidths(), this.silent || this.table.columnManager.rerenderColumns());
  }
  matchChildWidths() {
    var e = 0;
    this.contentElement && this.columns.length && (this.columns.forEach(function(t) {
      t.visible && (e += t.getWidth());
    }), this.contentElement.style.maxWidth = e - 1 + "px", this.table.initialized && (this.element.style.width = e + "px"), this.parent.isGroup && this.parent.matchChildWidths());
  }
  removeChild(e) {
    var t = this.columns.indexOf(e);
    t > -1 && this.columns.splice(t, 1), this.columns.length || this.delete();
  }
  setWidth(e) {
    this.widthFixed = !0, this.setWidthActual(e);
  }
  setWidthActual(e) {
    isNaN(e) && (e = Math.floor(this.table.element.clientWidth / 100 * parseInt(e))), e = Math.max(this.minWidth, e), this.maxWidth && (e = Math.min(this.maxWidth, e)), this.width = e, this.widthStyled = e ? e + "px" : "", this.element.style.width = this.widthStyled, this.isGroup || this.cells.forEach(function(t) {
      t.setWidth();
    }), this.parent.isGroup && this.parent.matchChildWidths(), this.dispatch("column-width", this), this.subscribedExternal("columnWidth") && this.dispatchExternal("columnWidth", this.getComponent());
  }
  checkCellHeights() {
    var e = [];
    this.cells.forEach(function(t) {
      t.row.heightInitialized && (t.row.getElement().offsetParent !== null ? (e.push(t.row), t.row.clearCellHeight()) : t.row.heightInitialized = !1);
    }), e.forEach(function(t) {
      t.calcHeight();
    }), e.forEach(function(t) {
      t.setCellHeight();
    });
  }
  getWidth() {
    var e = 0;
    return this.isGroup ? this.columns.forEach(function(t) {
      t.visible && (e += t.getWidth());
    }) : e = this.width, e;
  }
  getLeftOffset() {
    var e = this.element.offsetLeft;
    return this.parent.isGroup && (e += this.parent.getLeftOffset()), e;
  }
  getHeight() {
    return Math.ceil(this.element.getBoundingClientRect().height);
  }
  setMinWidth(e) {
    this.maxWidth && e > this.maxWidth && (e = this.maxWidth, console.warn("the minWidth (" + e + "px) for column '" + this.field + "' cannot be bigger that its maxWidth (" + this.maxWidthStyled + ")")), this.minWidth = e, this.minWidthStyled = e ? e + "px" : "", this.element.style.minWidth = this.minWidthStyled, this.cells.forEach(function(t) {
      t.setMinWidth();
    });
  }
  setMaxWidth(e) {
    this.minWidth && e < this.minWidth && (e = this.minWidth, console.warn("the maxWidth (" + e + "px) for column '" + this.field + "' cannot be smaller that its minWidth (" + this.minWidthStyled + ")")), this.maxWidth = e, this.maxWidthStyled = e ? e + "px" : "", this.element.style.maxWidth = this.maxWidthStyled, this.cells.forEach(function(t) {
      t.setMaxWidth();
    });
  }
  delete() {
    return new Promise((e, t) => {
      this.isGroup && this.columns.forEach(function(s) {
        s.delete();
      }), this.dispatch("column-delete", this);
      var i = this.cells.length;
      for (let s = 0; s < i; s++)
        this.cells[0].delete();
      this.element.parentNode && this.element.parentNode.removeChild(this.element), this.element = !1, this.contentElement = !1, this.titleElement = !1, this.groupElement = !1, this.parent.isGroup && this.parent.removeChild(this), this.table.columnManager.deregisterColumn(this), this.table.columnManager.rerenderColumns(!0), this.dispatch("column-deleted", this), e();
    });
  }
  columnRendered() {
    this.titleFormatterRendered && this.titleFormatterRendered(), this.dispatch("column-rendered", this);
  }
  //////////////// Cell Management /////////////////
  //generate cell for this column
  generateCell(e) {
    var t = new ft(this, e);
    return this.cells.push(t), t;
  }
  nextColumn() {
    var e = this.table.columnManager.findColumnIndex(this);
    return e > -1 ? this._nextVisibleColumn(e + 1) : !1;
  }
  _nextVisibleColumn(e) {
    var t = this.table.columnManager.getColumnByIndex(e);
    return !t || t.visible ? t : this._nextVisibleColumn(e + 1);
  }
  prevColumn() {
    var e = this.table.columnManager.findColumnIndex(this);
    return e > -1 ? this._prevVisibleColumn(e - 1) : !1;
  }
  _prevVisibleColumn(e) {
    var t = this.table.columnManager.getColumnByIndex(e);
    return !t || t.visible ? t : this._prevVisibleColumn(e - 1);
  }
  reinitializeWidth(e) {
    this.widthFixed = !1, typeof this.definition.width < "u" && !e && this.setWidth(this.definition.width), this.dispatch("column-width-fit-before", this), this.fitToData(e), this.dispatch("column-width-fit-after", this);
  }
  //set column width to maximum cell width for non group columns
  fitToData(e) {
    if (!this.isGroup) {
      this.widthFixed || (this.element.style.width = "", this.cells.forEach((s) => {
        s.clearWidth();
      }));
      var t = this.element.offsetWidth;
      if ((!this.width || !this.widthFixed) && (this.cells.forEach((s) => {
        var n = s.getWidth();
        n > t && (t = n);
      }), t)) {
        var i = t + 1;
        e ? this.setWidth(i) : (this.maxInitialWidth && !e && (i = Math.min(i, this.maxInitialWidth)), this.setWidthActual(i));
      }
    }
  }
  updateDefinition(e) {
    var t;
    return this.isGroup || this.parent.isGroup ? (console.error("Column Update Error - The updateDefinition function is only available on ungrouped columns"), Promise.reject("Column Update Error - The updateDefinition function is only available on columns, not column groups")) : (t = Object.assign({}, this.getDefinition()), t = Object.assign(t, e), this.table.columnManager.addColumn(t, !1, this).then((i) => (t.field == this.field && (this.field = !1), this.delete().then(() => i.getComponent()))));
  }
  deleteCell(e) {
    var t = this.cells.indexOf(e);
    t > -1 && this.cells.splice(t, 1);
  }
  //////////////// Object Generation /////////////////
  getComponent() {
    return this.component || (this.component = new qi(this)), this.component;
  }
  getPosition() {
    return this.table.columnManager.getVisibleColumnsByIndex().indexOf(this) + 1;
  }
  getParentComponent() {
    return this.parent instanceof Ie ? this.parent.getComponent() : !1;
  }
};
R(Ie, "defaultOptionList", Ki);
let je = Ie;
class Tt {
  constructor(e) {
    return this._row = e, new Proxy(this, {
      get: function(t, i, s) {
        return typeof t[i] < "u" ? t[i] : t._row.table.componentFunctionBinder.handle("row", t._row, i);
      }
    });
  }
  getData(e) {
    return this._row.getData(e);
  }
  getElement() {
    return this._row.getElement();
  }
  getCells() {
    var e = [];
    return this._row.getCells().forEach(function(t) {
      e.push(t.getComponent());
    }), e;
  }
  getCell(e) {
    var t = this._row.getCell(e);
    return t ? t.getComponent() : !1;
  }
  getIndex() {
    return this._row.getData("data")[this._row.table.options.index];
  }
  getPosition() {
    return this._row.getPosition();
  }
  watchPosition(e) {
    return this._row.watchPosition(e);
  }
  delete() {
    return this._row.delete();
  }
  scrollTo(e, t) {
    return this._row.table.rowManager.scrollToRow(this._row, e, t);
  }
  move(e, t) {
    this._row.moveToRow(e, t);
  }
  update(e) {
    return this._row.updateData(e);
  }
  normalizeHeight() {
    this._row.normalizeHeight(!0);
  }
  _getSelf() {
    return this._row;
  }
  reformat() {
    return this._row.reinitialize();
  }
  getTable() {
    return this._row.table;
  }
  getNextRow() {
    var e = this._row.nextRow();
    return e && e.getComponent();
  }
  getPrevRow() {
    var e = this._row.prevRow();
    return e && e.getComponent();
  }
}
const rt = class rt extends ie {
  constructor(e, t, i = "row") {
    super(t.table), this.parent = t, this.data = {}, this.type = i, this.element = !1, this.modules = {}, this.cells = [], this.height = 0, this.heightStyled = "", this.manualHeight = !1, this.outerHeight = 0, this.initialized = !1, this.heightInitialized = !1, this.position = 0, this.positionWatchers = [], this.component = null, this.created = !1, this.setData(e);
  }
  create() {
    this.created || (this.created = !0, this.generateElement());
  }
  createElement() {
    this.element = rt.rowTemplate.cloneNode(!1);
  }
  getElement() {
    return this.create(), this.element;
  }
  detachElement() {
    this.element && this.element.parentNode && this.element.parentNode.removeChild(this.element);
  }
  generateElement() {
    this.createElement(), this.dispatch("row-init", this);
  }
  generateCells() {
    this.cells = this.table.columnManager.generateCells(this);
  }
  //functions to setup on first render
  initialize(e, t) {
    if (this.create(), !this.initialized || e) {
      for (this.deleteCells(); this.element.firstChild; ) this.element.removeChild(this.element.firstChild);
      this.dispatch("row-layout-before", this), this.generateCells(), this.initialized = !0, this.table.columnManager.renderer.renderRowCells(this, t), e && this.normalizeHeight(), this.dispatch("row-layout", this), this.table.options.rowFormatter && this.table.options.rowFormatter(this.getComponent()), this.dispatch("row-layout-after", this);
    } else
      this.table.columnManager.renderer.rerenderRowCells(this, t);
  }
  rendered() {
    this.cells.forEach((e) => {
      e.cellRendered();
    });
  }
  reinitializeHeight() {
    this.heightInitialized = !1, this.element && this.element.offsetParent !== null && this.normalizeHeight(!0);
  }
  deinitialize() {
    this.initialized = !1;
  }
  deinitializeHeight() {
    this.heightInitialized = !1;
  }
  reinitialize(e) {
    this.initialized = !1, this.heightInitialized = !1, this.manualHeight || (this.height = 0, this.heightStyled = ""), this.element && this.element.offsetParent !== null && this.initialize(!0), this.dispatch("row-relayout", this);
  }
  //get heights when doing bulk row style calcs in virtual DOM
  calcHeight(e) {
    var t = 0, i = 0;
    this.table.options.rowHeight ? this.height = this.table.options.rowHeight : (i = this.calcMinHeight(), t = this.calcMaxHeight(), e ? this.height = Math.max(t, i) : this.height = this.manualHeight ? this.height : Math.max(t, i)), this.heightStyled = this.height ? this.height + "px" : "", this.outerHeight = this.element.offsetHeight;
  }
  calcMinHeight() {
    return this.table.options.resizableRows ? this.element.clientHeight : 0;
  }
  calcMaxHeight() {
    var e = 0;
    return this.cells.forEach(function(t) {
      var i = t.getHeight();
      i > e && (e = i);
    }), e;
  }
  //set of cells
  setCellHeight() {
    this.cells.forEach(function(e) {
      e.setHeight();
    }), this.heightInitialized = !0;
  }
  clearCellHeight() {
    this.cells.forEach(function(e) {
      e.clearHeight();
    });
  }
  //normalize the height of elements in the row
  normalizeHeight(e) {
    e && !this.table.options.rowHeight && this.clearCellHeight(), this.calcHeight(e), this.setCellHeight();
  }
  //set height of rows
  setHeight(e, t) {
    (this.height != e || t) && (this.manualHeight = !0, this.height = e, this.heightStyled = e ? e + "px" : "", this.setCellHeight(), this.outerHeight = this.element.offsetHeight, this.subscribedExternal("rowHeight") && this.dispatchExternal("rowHeight", this.getComponent()));
  }
  //return rows outer height
  getHeight() {
    return this.outerHeight;
  }
  //return rows outer Width
  getWidth() {
    return this.element.offsetWidth;
  }
  //////////////// Cell Management /////////////////
  deleteCell(e) {
    var t = this.cells.indexOf(e);
    t > -1 && this.cells.splice(t, 1);
  }
  //////////////// Data Management /////////////////
  setData(e) {
    this.data = this.chain("row-data-init-before", [this, e], void 0, e), this.dispatch("row-data-init-after", this);
  }
  //update the rows data
  updateData(e) {
    var t = this.element && K.elVisible(this.element), i = {}, s;
    return new Promise((n, r) => {
      typeof e == "string" && (e = JSON.parse(e)), this.dispatch("row-data-save-before", this), this.subscribed("row-data-changing") && (i = Object.assign(i, this.data), i = Object.assign(i, e)), s = this.chain("row-data-changing", [this, i, e], null, e);
      const a = [];
      for (let l in e)
        this.table.columnManager.getColumnsByFieldRoot(l).forEach((d) => {
          let c = this.getCell(d.getField());
          if (c) {
            let u = d.getFieldValue(s);
            c.getValue() !== u && a.push([c, u]);
          }
        });
      for (let l in s)
        this.data[l] = s[l];
      this.dispatch("row-data-save-after", this), a.forEach(([l, h]) => {
        l.setValueProcessData(h), t && l.cellRendered();
      }), t ? (this.normalizeHeight(!0), this.table.options.rowFormatter && this.table.options.rowFormatter(this.getComponent())) : (this.initialized = !1, this.height = 0, this.heightStyled = ""), this.dispatch("row-data-changed", this, t, e), this.dispatchExternal("rowUpdated", this.getComponent()), this.subscribedExternal("dataChanged") && this.dispatchExternal("dataChanged", this.table.rowManager.getData()), n();
    });
  }
  getData(e) {
    return e ? this.chain("row-data-retrieve", [this, e], null, this.data) : this.data;
  }
  getCell(e) {
    var t = !1;
    return e = this.table.columnManager.findColumn(e), !this.initialized && this.cells.length === 0 && this.generateCells(), t = this.cells.find(function(i) {
      return i.column === e;
    }), t;
  }
  getCellIndex(e) {
    return this.cells.findIndex(function(t) {
      return t === e;
    });
  }
  findCell(e) {
    return this.cells.find((t) => t.element === e);
  }
  getCells() {
    return !this.initialized && this.cells.length === 0 && this.generateCells(), this.cells;
  }
  nextRow() {
    var e = this.table.rowManager.nextDisplayRow(this, !0);
    return e || !1;
  }
  prevRow() {
    var e = this.table.rowManager.prevDisplayRow(this, !0);
    return e || !1;
  }
  moveToRow(e, t) {
    var i = this.table.rowManager.findRow(e);
    i ? (this.table.rowManager.moveRowActual(this, i, !t), this.table.rowManager.refreshActiveData("display", !1, !0)) : console.warn("Move Error - No matching row found:", e);
  }
  ///////////////////// Actions  /////////////////////
  delete() {
    return this.dispatch("row-delete", this), this.deleteActual(), Promise.resolve();
  }
  deleteActual(e) {
    this.detachModules(), this.table.rowManager.deleteRow(this, e), this.deleteCells(), this.initialized = !1, this.heightInitialized = !1, this.element = !1, this.dispatch("row-deleted", this);
  }
  detachModules() {
    this.dispatch("row-deleting", this);
  }
  deleteCells() {
    var e = this.cells.length;
    for (let t = 0; t < e; t++)
      this.cells[0].delete();
  }
  wipe() {
    if (this.detachModules(), this.deleteCells(), this.element) {
      for (; this.element.firstChild; ) this.element.removeChild(this.element.firstChild);
      this.element.parentNode && this.element.parentNode.removeChild(this.element);
    }
    this.element = !1, this.modules = {};
  }
  isDisplayed() {
    return this.table.rowManager.getDisplayRows().includes(this);
  }
  getPosition() {
    return this.isDisplayed() ? this.position : !1;
  }
  setPosition(e) {
    e != this.position && (this.position = e, this.positionWatchers.forEach((t) => {
      t(this.position);
    }));
  }
  watchPosition(e) {
    this.positionWatchers.push(e), e(this.position);
  }
  getGroup() {
    return this.modules.group || !1;
  }
  //////////////// Object Generation /////////////////
  getComponent() {
    return this.component || (this.component = new Tt(this)), this.component;
  }
  static createRowTemplate() {
    const e = document.createElement("div");
    return e.classList.add("tabulator-row"), e.setAttribute("role", "row"), e;
  }
};
R(rt, "rowTemplate", rt.createRowTemplate());
let te = rt;
var Zs = {
  avg: function(o, e, t) {
    var i = 0, s = typeof t.precision < "u" ? t.precision : 2;
    return o.length && (i = o.reduce(function(n, r) {
      return Number(n) + Number(r);
    }), i = i / o.length, i = s !== !1 ? i.toFixed(s) : i), parseFloat(i).toString();
  },
  max: function(o, e, t) {
    var i = null, s = typeof t.precision < "u" ? t.precision : !1;
    return o.forEach(function(n) {
      n = Number(n), (n > i || i === null) && (i = n);
    }), i !== null ? s !== !1 ? i.toFixed(s) : i : "";
  },
  min: function(o, e, t) {
    var i = null, s = typeof t.precision < "u" ? t.precision : !1;
    return o.forEach(function(n) {
      n = Number(n), (n < i || i === null) && (i = n);
    }), i !== null ? s !== !1 ? i.toFixed(s) : i : "";
  },
  sum: function(o, e, t) {
    var i = 0, s = typeof t.precision < "u" ? t.precision : !1;
    return o.length && o.forEach(function(n) {
      n = Number(n), i += isNaN(n) ? 0 : Number(n);
    }), s !== !1 ? i.toFixed(s) : i;
  },
  concat: function(o, e, t) {
    var i = 0;
    return o.length && (i = o.reduce(function(s, n) {
      return String(s) + String(n);
    })), i;
  },
  count: function(o, e, t) {
    var i = 0;
    return o.length && o.forEach(function(s) {
      s && i++;
    }), i;
  },
  unique: function(o, e, t) {
    var i = o.filter((s, n) => (o || s === 0) && o.indexOf(s) === n);
    return i.length;
  }
};
const De = class De extends B {
  constructor(e) {
    super(e), this.topCalcs = [], this.botCalcs = [], this.genColumn = !1, this.topElement = this.createElement(), this.botElement = this.createElement(), this.topRow = !1, this.botRow = !1, this.topInitialized = !1, this.botInitialized = !1, this.topBreakElement = null, this.blocked = !1, this.recalcAfterBlock = !1, this.registerTableOption("columnCalcs", !0), this.registerColumnOption("topCalc"), this.registerColumnOption("topCalcParams"), this.registerColumnOption("topCalcFormatter"), this.registerColumnOption("topCalcFormatterParams"), this.registerColumnOption("bottomCalc"), this.registerColumnOption("bottomCalcParams"), this.registerColumnOption("bottomCalcFormatter"), this.registerColumnOption("bottomCalcFormatterParams");
  }
  createElement() {
    var e = document.createElement("div");
    return e.classList.add("tabulator-calcs-holder"), e;
  }
  initialize() {
    this.genColumn = new je({ field: "value" }, this), this.subscribe("cell-value-changed", this.cellValueChanged.bind(this)), this.subscribe("column-init", this.initializeColumnCheck.bind(this)), this.subscribe("row-deleted", this.rowsUpdated.bind(this)), this.subscribe("scroll-horizontal", this.scrollHorizontal.bind(this)), this.subscribe("row-added", this.rowsUpdated.bind(this)), this.subscribe("column-moved", this.recalcActiveRows.bind(this)), this.subscribe("column-add", this.recalcActiveRows.bind(this)), this.subscribe("data-refreshed", this.recalcActiveRowsRefresh.bind(this)), this.subscribe("table-redraw", this.tableRedraw.bind(this)), this.subscribe("rows-visible", this.visibleRows.bind(this)), this.subscribe("scrollbar-vertical", this.adjustForScrollbar.bind(this)), this.subscribe("redraw-blocked", this.blockRedraw.bind(this)), this.subscribe("redraw-restored", this.restoreRedraw.bind(this)), this.subscribe("table-redrawing", this.resizeHolderWidth.bind(this)), this.subscribe("column-resized", this.resizeHolderWidth.bind(this)), this.subscribe("column-show", this.resizeHolderWidth.bind(this)), this.subscribe("column-hide", this.resizeHolderWidth.bind(this)), this.registerTableFunction("getCalcResults", this.getResults.bind(this)), this.registerTableFunction("recalc", this.userRecalc.bind(this)), this.resizeHolderWidth();
  }
  resizeHolderWidth() {
    this.topElement.style.minWidth = this.table.columnManager.headersElement.offsetWidth + "px";
  }
  tableRedraw(e) {
    this.recalc(this.table.rowManager.activeRows), e && this.redraw();
  }
  blockRedraw() {
    this.blocked = !0, this.recalcAfterBlock = !1;
  }
  restoreRedraw() {
    this.blocked = !1, this.recalcAfterBlock && (this.recalcAfterBlock = !1, this.recalcActiveRowsRefresh());
  }
  ///////////////////////////////////
  ///////// Table Functions /////////
  ///////////////////////////////////
  userRecalc() {
    this.recalc(this.table.rowManager.activeRows);
  }
  ///////////////////////////////////
  ///////// Internal Logic //////////
  ///////////////////////////////////
  blockCheck() {
    return this.blocked && (this.recalcAfterBlock = !0), this.blocked;
  }
  visibleRows(e, t) {
    return this.topRow && t.unshift(this.topRow), this.botRow && t.push(this.botRow), t;
  }
  rowsUpdated(e) {
    this.table.options.groupBy ? this.recalcRowGroup(e) : this.recalcActiveRows();
  }
  recalcActiveRowsRefresh() {
    this.table.options.groupBy && this.table.options.dataTreeStartExpanded && this.table.options.dataTree ? this.recalcAll() : this.recalcActiveRows();
  }
  recalcActiveRows() {
    this.recalc(this.table.rowManager.activeRows);
  }
  cellValueChanged(e) {
    (e.column.definition.topCalc || e.column.definition.bottomCalc) && (this.table.options.groupBy ? ((this.table.options.columnCalcs == "table" || this.table.options.columnCalcs == "both") && this.recalcActiveRows(), this.table.options.columnCalcs != "table" && this.recalcRowGroup(e.row)) : this.recalcActiveRows());
  }
  initializeColumnCheck(e) {
    (e.definition.topCalc || e.definition.bottomCalc) && this.initializeColumn(e);
  }
  //initialize column calcs
  initializeColumn(e) {
    var t = e.definition, i = {
      topCalcParams: t.topCalcParams || {},
      botCalcParams: t.bottomCalcParams || {}
    };
    if (t.topCalc) {
      switch (typeof t.topCalc) {
        case "string":
          De.calculations[t.topCalc] ? i.topCalc = De.calculations[t.topCalc] : console.warn("Column Calc Error - No such calculation found, ignoring: ", t.topCalc);
          break;
        case "function":
          i.topCalc = t.topCalc;
          break;
      }
      i.topCalc && (e.modules.columnCalcs = i, this.topCalcs.push(e), this.table.options.columnCalcs != "group" && this.initializeTopRow());
    }
    if (t.bottomCalc) {
      switch (typeof t.bottomCalc) {
        case "string":
          De.calculations[t.bottomCalc] ? i.botCalc = De.calculations[t.bottomCalc] : console.warn("Column Calc Error - No such calculation found, ignoring: ", t.bottomCalc);
          break;
        case "function":
          i.botCalc = t.bottomCalc;
          break;
      }
      i.botCalc && (e.modules.columnCalcs = i, this.botCalcs.push(e), this.table.options.columnCalcs != "group" && this.initializeBottomRow());
    }
  }
  //dummy functions to handle being mock column manager
  registerColumnField() {
  }
  removeCalcs() {
    var e = !1;
    this.topInitialized && (this.topInitialized = !1, this.topBreakElement && this.topBreakElement.parentNode && this.topBreakElement.parentNode.removeChild(this.topBreakElement), this.topElement.parentNode.removeChild(this.topElement), e = !0), this.botInitialized && (this.botInitialized = !1, this.footerRemove(this.botElement), e = !0), e && this.table.rowManager.adjustTableSize();
  }
  reinitializeCalcs() {
    this.topCalcs.length && this.initializeTopRow(), this.botCalcs.length && this.initializeBottomRow();
  }
  initializeTopRow() {
    var e = document.createDocumentFragment();
    this.topInitialized || (this.topBreakElement = document.createElement("br"), e.appendChild(this.topBreakElement), e.appendChild(this.topElement), this.table.columnManager.getContentsElement().insertBefore(e, this.table.columnManager.headersElement.nextSibling), this.topInitialized = !0);
  }
  initializeBottomRow() {
    this.botInitialized || (this.footerPrepend(this.botElement), this.botInitialized = !0);
  }
  scrollHorizontal(e) {
    this.botInitialized && this.botRow && (this.botElement.scrollLeft = e);
  }
  recalc(e) {
    var t, i;
    if (!this.blockCheck() && (this.topInitialized || this.botInitialized)) {
      if (t = this.rowsToData(e), this.topInitialized) {
        for (this.topRow && this.topRow.deleteCells(), i = this.generateRow("top", t), this.topRow = i; this.topElement.firstChild; ) this.topElement.removeChild(this.topElement.firstChild);
        this.topElement.appendChild(i.getElement()), i.initialize(!0);
      }
      if (this.botInitialized) {
        for (this.botRow && this.botRow.deleteCells(), i = this.generateRow("bottom", t), this.botRow = i; this.botElement.firstChild; ) this.botElement.removeChild(this.botElement.firstChild);
        this.botElement.appendChild(i.getElement()), i.initialize(!0);
      }
      this.table.rowManager.adjustTableSize(), this.table.modExists("frozenColumns") && this.table.modules.frozenColumns.layout();
    }
  }
  recalcRowGroup(e) {
    this.recalcGroup(this.table.modules.groupRows.getRowGroup(e));
  }
  recalcAll() {
    if ((this.topCalcs.length || this.botCalcs.length) && (this.table.options.columnCalcs !== "group" && this.recalcActiveRows(), this.table.options.groupBy && this.table.options.columnCalcs !== "table")) {
      var e = this.table.modules.groupRows.getChildGroups();
      e.forEach((t) => {
        this.recalcGroup(t);
      });
    }
  }
  recalcGroup(e) {
    var t, i;
    this.blockCheck() || e && e.calcs && (e.calcs.bottom && (t = this.rowsToData(e.rows), i = this.generateRowData("bottom", t), e.calcs.bottom.updateData(i), e.calcs.bottom.reinitialize()), e.calcs.top && (t = this.rowsToData(e.rows), i = this.generateRowData("top", t), e.calcs.top.updateData(i), e.calcs.top.reinitialize()));
  }
  //generate top stats row
  generateTopRow(e) {
    return this.generateRow("top", this.rowsToData(e));
  }
  //generate bottom stats row
  generateBottomRow(e) {
    return this.generateRow("bottom", this.rowsToData(e));
  }
  rowsToData(e) {
    var t = [], i = this.table.options.dataTree && this.table.options.dataTreeChildColumnCalcs, s = this.table.modules.dataTree;
    return e.forEach((n) => {
      var r;
      t.push(n.getData()), i && ((r = n.modules.dataTree) != null && r.open) && this.rowsToData(s.getFilteredTreeChildren(n)).forEach((a) => {
        t.push(a);
      });
    }), t;
  }
  //generate stats row
  generateRow(e, t) {
    var i = this.generateRowData(e, t), s;
    return this.table.modExists("mutator") && this.table.modules.mutator.disable(), s = new te(i, this, "calc"), this.table.modExists("mutator") && this.table.modules.mutator.enable(), s.getElement().classList.add("tabulator-calcs", "tabulator-calcs-" + e), s.component = !1, s.getComponent = () => (s.component || (s.component = new Ys(s)), s.component), s.generateCells = () => {
      var n = [];
      this.table.columnManager.columnsByIndex.forEach((r) => {
        this.genColumn.setField(r.getField()), this.genColumn.hozAlign = r.hozAlign, r.definition[e + "CalcFormatter"] && this.table.modExists("format") ? this.genColumn.modules.format = {
          formatter: this.table.modules.format.lookupFormatter(r.definition[e + "CalcFormatter"]),
          params: r.definition[e + "CalcFormatterParams"] || {}
        } : this.genColumn.modules.format = {
          formatter: this.table.modules.format.lookupFormatter("plaintext"),
          params: {}
        }, this.genColumn.definition.cssClass = r.definition.cssClass;
        var a = new ft(this.genColumn, s);
        a.getElement(), a.column = r, a.setWidth(), r.cells.push(a), n.push(a), r.visible || a.hide();
      }), s.cells = n;
    }, s;
  }
  //generate stats row
  generateRowData(e, t) {
    var i = {}, s = e == "top" ? this.topCalcs : this.botCalcs, n = e == "top" ? "topCalc" : "botCalc", r, a;
    return s.forEach(function(l) {
      var h = [];
      l.modules.columnCalcs && l.modules.columnCalcs[n] && (t.forEach(function(d) {
        h.push(l.getFieldValue(d));
      }), a = n + "Params", r = typeof l.modules.columnCalcs[a] == "function" ? l.modules.columnCalcs[a](h, t) : l.modules.columnCalcs[a], l.setFieldValue(i, l.modules.columnCalcs[n](h, t, r)));
    }), i;
  }
  hasTopCalcs() {
    return !!this.topCalcs.length;
  }
  hasBottomCalcs() {
    return !!this.botCalcs.length;
  }
  //handle table redraw
  redraw() {
    this.topRow && this.topRow.normalizeHeight(!0), this.botRow && this.botRow.normalizeHeight(!0);
  }
  //return the calculated
  getResults() {
    var e = {}, t;
    return this.table.options.groupBy && this.table.modExists("groupRows") ? (t = this.table.modules.groupRows.getGroups(!0), t.forEach((i) => {
      e[i.getKey()] = this.getGroupResults(i);
    })) : e = {
      top: this.topRow ? this.topRow.getData() : {},
      bottom: this.botRow ? this.botRow.getData() : {}
    }, e;
  }
  //get results from a group
  getGroupResults(e) {
    var t = e._getSelf(), i = e.getSubGroups(), s = {}, n = {};
    return i.forEach((r) => {
      s[r.getKey()] = this.getGroupResults(r);
    }), n = {
      top: t.calcs.top ? t.calcs.top.getData() : {},
      bottom: t.calcs.bottom ? t.calcs.bottom.getData() : {},
      groups: s
    }, n;
  }
  adjustForScrollbar(e) {
    this.botRow && (this.table.rtl ? this.botElement.style.paddingLeft = e + "px" : this.botElement.style.paddingRight = e + "px");
  }
};
R(De, "moduleName", "columnCalcs"), //load defaults
R(De, "calculations", Zs);
let Xt = De;
class Ji extends B {
  constructor(e) {
    super(e), this.indent = 10, this.field = "", this.collapseEl = null, this.expandEl = null, this.branchEl = null, this.elementField = !1, this.startOpen = function() {
    }, this.registerTableOption("dataTree", !1), this.registerTableOption("dataTreeFilter", !0), this.registerTableOption("dataTreeSort", !0), this.registerTableOption("dataTreeElementColumn", !1), this.registerTableOption("dataTreeBranchElement", !0), this.registerTableOption("dataTreeChildIndent", 9), this.registerTableOption("dataTreeChildField", "_children"), this.registerTableOption("dataTreeCollapseElement", !1), this.registerTableOption("dataTreeExpandElement", !1), this.registerTableOption("dataTreeStartExpanded", !1), this.registerTableOption("dataTreeChildColumnCalcs", !1), this.registerTableOption("dataTreeSelectPropagate", !1), this.registerComponentFunction("row", "treeCollapse", this.collapseRow.bind(this)), this.registerComponentFunction("row", "treeExpand", this.expandRow.bind(this)), this.registerComponentFunction("row", "treeToggle", this.toggleRow.bind(this)), this.registerComponentFunction("row", "getTreeParent", this.getTreeParent.bind(this)), this.registerComponentFunction("row", "getTreeChildren", this.getRowChildren.bind(this)), this.registerComponentFunction("row", "addTreeChild", this.addTreeChildRow.bind(this)), this.registerComponentFunction("row", "isTreeExpanded", this.isRowExpanded.bind(this));
  }
  initialize() {
    if (this.table.options.dataTree) {
      var e = null, t = this.table.options;
      switch (this.field = t.dataTreeChildField, this.indent = t.dataTreeChildIndent, this.options("movableRows") && console.warn("The movableRows option is not available with dataTree enabled, moving of child rows could result in unpredictable behavior"), t.dataTreeBranchElement ? t.dataTreeBranchElement === !0 ? (this.branchEl = document.createElement("div"), this.branchEl.classList.add("tabulator-data-tree-branch")) : typeof t.dataTreeBranchElement == "string" ? (e = document.createElement("div"), e.innerHTML = t.dataTreeBranchElement, this.branchEl = e.firstChild) : this.branchEl = t.dataTreeBranchElement : (this.branchEl = document.createElement("div"), this.branchEl.classList.add("tabulator-data-tree-branch-empty")), t.dataTreeCollapseElement ? typeof t.dataTreeCollapseElement == "string" ? (e = document.createElement("div"), e.innerHTML = t.dataTreeCollapseElement, this.collapseEl = e.firstChild) : this.collapseEl = t.dataTreeCollapseElement : (this.collapseEl = document.createElement("div"), this.collapseEl.classList.add("tabulator-data-tree-control"), this.collapseEl.tabIndex = 0, this.collapseEl.innerHTML = "<div class='tabulator-data-tree-control-collapse'></div>"), t.dataTreeExpandElement ? typeof t.dataTreeExpandElement == "string" ? (e = document.createElement("div"), e.innerHTML = t.dataTreeExpandElement, this.expandEl = e.firstChild) : this.expandEl = t.dataTreeExpandElement : (this.expandEl = document.createElement("div"), this.expandEl.classList.add("tabulator-data-tree-control"), this.expandEl.tabIndex = 0, this.expandEl.innerHTML = "<div class='tabulator-data-tree-control-expand'></div>"), typeof t.dataTreeStartExpanded) {
        case "boolean":
          this.startOpen = function(i, s) {
            return t.dataTreeStartExpanded;
          };
          break;
        case "function":
          this.startOpen = t.dataTreeStartExpanded;
          break;
        default:
          this.startOpen = function(i, s) {
            return t.dataTreeStartExpanded[s];
          };
          break;
      }
      this.subscribe("row-init", this.initializeRow.bind(this)), this.subscribe("row-layout-after", this.layoutRow.bind(this)), this.subscribe("row-deleting", this.rowDeleting.bind(this)), this.subscribe("row-deleted", this.rowDelete.bind(this), 0), this.subscribe("row-data-changed", this.rowDataChanged.bind(this), 10), this.subscribe("cell-value-updated", this.cellValueChanged.bind(this)), this.subscribe("edit-cancelled", this.cellValueChanged.bind(this)), this.subscribe("column-moving-rows", this.columnMoving.bind(this)), this.subscribe("table-built", this.initializeElementField.bind(this)), this.subscribe("table-redrawing", this.tableRedrawing.bind(this)), this.registerDisplayHandler(this.getRows.bind(this), 30);
    }
  }
  tableRedrawing(e) {
    var t;
    e && (t = this.table.rowManager.getRows(), t.forEach((i) => {
      this.reinitializeRowChildren(i);
    }));
  }
  initializeElementField() {
    var e = this.table.columnManager.getFirstVisibleColumn();
    this.elementField = this.table.options.dataTreeElementColumn || (e ? e.field : !1);
  }
  getRowChildren(e) {
    return this.getTreeChildren(e, !0);
  }
  columnMoving() {
    var e = [];
    return this.table.rowManager.rows.forEach((t) => {
      e = e.concat(this.getTreeChildren(t, !1, !0));
    }), e;
  }
  rowDataChanged(e, t, i) {
    this.redrawNeeded(i) && (this.initializeRow(e), t && (this.layoutRow(e), this.refreshData(!0)));
  }
  cellValueChanged(e) {
    var t = e.column.getField();
    t === this.elementField && this.layoutRow(e.row);
  }
  initializeRow(e) {
    var t = e.getData()[this.field], i = Array.isArray(t), s = i || !i && typeof t == "object" && t !== null;
    !s && e.modules.dataTree && e.modules.dataTree.branchEl && e.modules.dataTree.branchEl.parentNode && e.modules.dataTree.branchEl.parentNode.removeChild(e.modules.dataTree.branchEl), !s && e.modules.dataTree && e.modules.dataTree.controlEl && e.modules.dataTree.controlEl.parentNode && e.modules.dataTree.controlEl.parentNode.removeChild(e.modules.dataTree.controlEl), e.modules.dataTree = {
      index: e.modules.dataTree ? e.modules.dataTree.index : 0,
      open: s ? e.modules.dataTree ? e.modules.dataTree.open : this.startOpen(e.getComponent(), 0) : !1,
      controlEl: e.modules.dataTree && s ? e.modules.dataTree.controlEl : !1,
      branchEl: e.modules.dataTree && s ? e.modules.dataTree.branchEl : !1,
      parent: e.modules.dataTree ? e.modules.dataTree.parent : !1,
      children: s
    };
  }
  reinitializeRowChildren(e) {
    var t = this.getTreeChildren(e, !1, !0);
    t.forEach(function(i) {
      i.reinitialize(!0);
    });
  }
  layoutRow(e) {
    var t = this.elementField ? e.getCell(this.elementField) : e.getCells()[0], i = t.getElement(), s = e.modules.dataTree;
    if (s.branchEl && (s.branchEl.parentNode && s.branchEl.parentNode.removeChild(s.branchEl), s.branchEl = !1), s.controlEl && (s.controlEl.parentNode && s.controlEl.parentNode.removeChild(s.controlEl), s.controlEl = !1), this.generateControlElement(e, i), e.getElement().classList.add("tabulator-tree-level-" + s.index), s.index)
      if (this.branchEl) {
        s.branchEl = this.branchEl.cloneNode(!0), i.insertBefore(s.branchEl, i.firstChild);
        let n = window.getComputedStyle(s.branchEl), a = (this.table.rtl ? parseInt(n.marginRight) || 0 : parseInt(n.marginLeft) || 0) + s.index * this.indent + "px";
        this.table.rtl ? s.branchEl.style.marginRight = a : s.branchEl.style.marginLeft = a;
      } else {
        let n = window.getComputedStyle(i), a = (this.table.rtl ? parseInt(n.paddingRight) || 0 : parseInt(n.paddingLeft) || 0) + s.index * this.indent + "px";
        this.table.rtl ? i.style.paddingRight = a : i.style.paddingLeft = a;
      }
  }
  generateControlElement(e, t) {
    var i = e.modules.dataTree, s = i.controlEl;
    t = t || e.getCells()[0].getElement(), i.children !== !1 && (i.open ? (i.controlEl = this.collapseEl.cloneNode(!0), i.controlEl.addEventListener("click", (n) => {
      n.stopPropagation(), this.collapseRow(e);
    })) : (i.controlEl = this.expandEl.cloneNode(!0), i.controlEl.addEventListener("click", (n) => {
      n.stopPropagation(), this.expandRow(e);
    })), i.controlEl.addEventListener("mousedown", (n) => {
      n.stopPropagation();
    }), s && s.parentNode === t ? s.parentNode.replaceChild(i.controlEl, s) : t.insertBefore(i.controlEl, t.firstChild));
  }
  getRows(e) {
    var t = [];
    return e.forEach((i, s) => {
      var n, r;
      t.push(i), i instanceof te && (i.create(), n = i.modules.dataTree, !n.index && n.children !== !1 && (r = this.getChildren(i, !1, !0), r.forEach((a) => {
        a.create(), t.push(a);
      })));
    }), t;
  }
  getChildren(e, t, i) {
    var s = e.modules.dataTree, n = [], r = [];
    return s.children !== !1 && (s.open || t) && (Array.isArray(s.children) || (s.children = this.generateChildren(e)), this.table.modExists("filter") && this.table.options.dataTreeFilter ? n = this.table.modules.filter.filter(s.children) : n = s.children, this.table.modExists("sort") && this.table.options.dataTreeSort && this.table.modules.sort.sort(n, i), n.forEach((a) => {
      r.push(a);
      var l = this.getChildren(a, !1, !0);
      l.forEach((h) => {
        r.push(h);
      });
    })), r;
  }
  generateChildren(e) {
    var t = [], i = e.getData()[this.field];
    return Array.isArray(i) || (i = [i]), i.forEach((s) => {
      var n = new te(s || {}, this.table.rowManager);
      n.create(), n.modules.dataTree.index = e.modules.dataTree.index + 1, n.modules.dataTree.parent = e, n.modules.dataTree.children && (n.modules.dataTree.open = this.startOpen(n.getComponent(), n.modules.dataTree.index)), t.push(n);
    }), t;
  }
  expandRow(e, t) {
    var i = e.modules.dataTree;
    i.children !== !1 && (i.open = !0, e.reinitialize(), this.refreshData(!0), this.dispatchExternal("dataTreeRowExpanded", e.getComponent(), e.modules.dataTree.index));
  }
  collapseRow(e) {
    var t = e.modules.dataTree;
    t.children !== !1 && (t.open = !1, e.reinitialize(), this.refreshData(!0), this.dispatchExternal("dataTreeRowCollapsed", e.getComponent(), e.modules.dataTree.index));
  }
  toggleRow(e) {
    var t = e.modules.dataTree;
    t.children !== !1 && (t.open ? this.collapseRow(e) : this.expandRow(e));
  }
  isRowExpanded(e) {
    return e.modules.dataTree.open;
  }
  getTreeParent(e) {
    return e.modules.dataTree.parent ? e.modules.dataTree.parent.getComponent() : !1;
  }
  getTreeParentRoot(e) {
    return e.modules.dataTree && e.modules.dataTree.parent ? this.getTreeParentRoot(e.modules.dataTree.parent) : e;
  }
  getFilteredTreeChildren(e) {
    var t = e.modules.dataTree, i = [], s;
    return t.children && (Array.isArray(t.children) || (t.children = this.generateChildren(e)), this.table.modExists("filter") && this.table.options.dataTreeFilter ? s = this.table.modules.filter.filter(t.children) : s = t.children, s.forEach((n) => {
      n instanceof te && i.push(n);
    })), i;
  }
  rowDeleting(e) {
    var t = e.modules.dataTree;
    t && t.children && Array.isArray(t.children) && t.children.forEach((i) => {
      i instanceof te && i.wipe();
    });
  }
  rowDelete(e) {
    var t = e.modules.dataTree.parent, i;
    t && (i = this.findChildIndex(e, t), i !== !1 && t.data[this.field].splice(i, 1), t.data[this.field].length || delete t.data[this.field], this.initializeRow(t), this.layoutRow(t)), this.refreshData(!0);
  }
  addTreeChildRow(e, t, i, s) {
    var n = !1;
    typeof t == "string" && (t = JSON.parse(t)), Array.isArray(e.data[this.field]) || (e.data[this.field] = [], e.modules.dataTree.open = this.startOpen(e.getComponent(), e.modules.dataTree.index)), typeof s < "u" && (n = this.findChildIndex(s, e), n !== !1 && e.data[this.field].splice(i ? n : n + 1, 0, t)), n === !1 && (i ? e.data[this.field].unshift(t) : e.data[this.field].push(t)), this.initializeRow(e), this.layoutRow(e), this.refreshData(!0);
  }
  findChildIndex(e, t) {
    var i = !1;
    return typeof e == "object" ? e instanceof te ? i = e.data : e instanceof Tt ? i = e._getSelf().data : typeof HTMLElement < "u" && e instanceof HTMLElement ? t.modules.dataTree && (i = t.modules.dataTree.children.find((s) => s instanceof te ? s.element === e : !1), i && (i = i.data)) : e === null && (i = !1) : typeof e > "u" ? i = !1 : i = t.data[this.field].find((s) => s.data[this.table.options.index] == e), i && (Array.isArray(t.data[this.field]) && (i = t.data[this.field].indexOf(i)), i == -1 && (i = !1)), i;
  }
  getTreeChildren(e, t, i) {
    var s = e.modules.dataTree, n = [];
    return s && s.children && (Array.isArray(s.children) || (s.children = this.generateChildren(e)), s.children.forEach((r) => {
      r instanceof te && (n.push(t ? r.getComponent() : r), i && this.getTreeChildren(r, t, i).forEach((a) => {
        n.push(a);
      }));
    })), n;
  }
  getChildField() {
    return this.field;
  }
  redrawNeeded(e) {
    return (this.field ? typeof e[this.field] < "u" : !1) || (this.elementField ? typeof e[this.elementField] < "u" : !1);
  }
}
R(Ji, "moduleName", "dataTree");
function Qs(o, e = {}, t) {
  var i = e.delimiter ? e.delimiter : ",", s = [], n = [];
  o.forEach((r) => {
    var a = [];
    switch (r.type) {
      case "group":
        console.warn("Download Warning - CSV downloader cannot process row groups");
        break;
      case "calc":
        console.warn("Download Warning - CSV downloader cannot process column calculations");
        break;
      case "header":
        r.columns.forEach((l, h) => {
          l && l.depth === 1 && (n[h] = typeof l.value > "u" || l.value === null ? "" : '"' + String(l.value).split('"').join('""') + '"');
        });
        break;
      case "row":
        r.columns.forEach((l) => {
          if (l) {
            switch (typeof l.value) {
              case "object":
                l.value = l.value !== null ? JSON.stringify(l.value) : "";
                break;
              case "undefined":
                l.value = "";
                break;
            }
            a.push('"' + String(l.value).split('"').join('""') + '"');
          }
        }), s.push(a.join(i));
        break;
    }
  }), n.length && s.unshift(n.join(i)), s = s.join(`
`), e.bom && (s = "\uFEFF" + s), t(s, "text/csv");
}
function en(o, e, t) {
  var i = [];
  o.forEach((s) => {
    var n = {};
    switch (s.type) {
      case "header":
        break;
      case "group":
        console.warn("Download Warning - JSON downloader cannot process row groups");
        break;
      case "calc":
        console.warn("Download Warning - JSON downloader cannot process column calculations");
        break;
      case "row":
        s.columns.forEach((r) => {
          r && (n[r.component.getTitleDownload() || r.component.getField()] = r.value);
        }), i.push(n);
        break;
    }
  }), i = JSON.stringify(i, null, "	"), t(i, "application/json");
}
function tn(o, e = {}, t) {
  var i = [], s = [], n = {}, r = e.rowGroupStyles || {
    fontStyle: "bold",
    fontSize: 12,
    cellPadding: 6,
    fillColor: 220
  }, a = e.rowCalcStyles || {
    fontStyle: "bold",
    fontSize: 10,
    cellPadding: 4,
    fillColor: 232
  }, l = e.jsPDF || {}, h = e.title ? e.title : "", d, c;
  l.orientation || (l.orientation = e.orientation || "landscape"), l.unit || (l.unit = "pt"), o.forEach((f) => {
    switch (f.type) {
      case "header":
        i.push(u(f));
        break;
      case "group":
        s.push(u(f, r));
        break;
      case "calc":
        s.push(u(f, a));
        break;
      case "row":
        s.push(u(f));
        break;
    }
  });
  function u(f, m) {
    var p = [];
    return f.columns.forEach((v) => {
      var b;
      if (v) {
        switch (typeof v.value) {
          case "object":
            v.value = v.value !== null ? JSON.stringify(v.value) : "";
            break;
          case "undefined":
            v.value = "";
            break;
        }
        b = {
          content: v.value,
          colSpan: v.width,
          rowSpan: v.height
        }, m && (b.styles = m), p.push(b);
      }
    }), p;
  }
  d = this.dependencyRegistry.lookup("jspdf", "jsPDF"), c = new d(l), e.autoTable && (typeof e.autoTable == "function" ? n = e.autoTable(c) || {} : n = e.autoTable), h && (n.didDrawPage = function(f) {
    c.text(h, 40, 30);
  }), n.head = i, n.body = s, c.autoTable(n), e.documentProcessing && e.documentProcessing(c), t(c.output("arraybuffer"), "application/pdf");
}
function sn(o, e, t) {
  var i = this, s = e.sheetName || "Sheet1", n = this.dependencyRegistry.lookup("XLSX"), r = n.utils.book_new(), a = new ie(this), l = "compress" in e ? e.compress : !0, h = e.writeOptions || { bookType: "xlsx", bookSST: !0, compression: l }, d;
  h.type = "binary", r.SheetNames = [], r.Sheets = {};
  function c() {
    var m = [], p = [], v = {}, b = { s: { c: 0, r: 0 }, e: { c: o[0] ? o[0].columns.reduce((k, S) => k + (S && S.width ? S.width : 1), 0) : 0, r: o.length } };
    return o.forEach((k, S) => {
      var F = [];
      k.columns.forEach(function(_, j) {
        _ ? (F.push(!(_.value instanceof Date) && typeof _.value == "object" ? JSON.stringify(_.value) : _.value), (_.width > 1 || _.height > -1) && (_.height > 1 || _.width > 1) && p.push({ s: { r: S, c: j }, e: { r: S + _.height - 1, c: j + _.width - 1 } })) : F.push("");
      }), m.push(F);
    }), n.utils.sheet_add_aoa(v, m), v["!ref"] = n.utils.encode_range(b), p.length && (v["!merges"] = p), v;
  }
  if (e.sheetOnly) {
    t(c());
    return;
  }
  if (e.sheets)
    for (var u in e.sheets)
      e.sheets[u] === !0 ? (r.SheetNames.push(u), r.Sheets[u] = c()) : (r.SheetNames.push(u), a.commsSend(e.sheets[u], "download", "intercept", {
        type: "xlsx",
        options: { sheetOnly: !0 },
        active: i.active,
        intercept: function(m) {
          r.Sheets[u] = m;
        }
      }));
  else
    r.SheetNames.push(s), r.Sheets[s] = c();
  e.documentProcessing && (r = e.documentProcessing(r));
  function f(m) {
    for (var p = new ArrayBuffer(m.length), v = new Uint8Array(p), b = 0; b != m.length; ++b) v[b] = m.charCodeAt(b) & 255;
    return p;
  }
  d = n.write(r, h), t(f(d), "application/octet-stream");
}
function nn(o, e, t) {
  this.modExists("export", !0) && t(this.modules.export.generateHTMLTable(o), "text/html");
}
function rn(o, e, t) {
  const i = [];
  o.forEach((s) => {
    const n = {};
    switch (s.type) {
      case "header":
        break;
      case "group":
        console.warn("Download Warning - JSON downloader cannot process row groups");
        break;
      case "calc":
        console.warn("Download Warning - JSON downloader cannot process column calculations");
        break;
      case "row":
        s.columns.forEach((r) => {
          r && (n[r.component.getTitleDownload() || r.component.getField()] = r.value);
        }), i.push(JSON.stringify(n));
        break;
    }
  }), t(i.join(`
`), "application/x-ndjson");
}
var on = {
  csv: Qs,
  json: en,
  jsonLines: rn,
  pdf: tn,
  xlsx: sn,
  html: nn
};
const Ye = class Ye extends B {
  constructor(e) {
    super(e), this.registerTableOption("downloadEncoder", function(t, i) {
      return new Blob([t], { type: i });
    }), this.registerTableOption("downloadConfig", {}), this.registerTableOption("downloadRowRange", "active"), this.registerColumnOption("download"), this.registerColumnOption("titleDownload");
  }
  initialize() {
    this.deprecatedOptionsCheck(), this.registerTableFunction("download", this.download.bind(this)), this.registerTableFunction("downloadToTab", this.downloadToTab.bind(this));
  }
  deprecatedOptionsCheck() {
  }
  ///////////////////////////////////
  ///////// Table Functions /////////
  ///////////////////////////////////
  downloadToTab(e, t, i, s) {
    this.download(e, t, i, s, !0);
  }
  ///////////////////////////////////
  ///////// Internal Logic //////////
  ///////////////////////////////////
  //trigger file download
  download(e, t, i, s, n) {
    var r = !1;
    function a(h, d) {
      n ? n === !0 ? this.triggerDownload(h, d, e, t, !0) : n(h) : this.triggerDownload(h, d, e, t);
    }
    if (typeof e == "function" ? r = e : Ye.downloaders[e] ? r = Ye.downloaders[e] : console.warn("Download Error - No such download type found: ", e), r) {
      var l = this.generateExportList(s);
      r.call(this.table, l, i || {}, a.bind(this));
    }
  }
  generateExportList(e) {
    var t = this.table.modules.export.generateExportList(this.table.options.downloadConfig, !1, e || this.table.options.downloadRowRange, "download"), i = this.table.options.groupHeaderDownload;
    return i && !Array.isArray(i) && (i = [i]), t.forEach((s) => {
      var n;
      s.type === "group" && (n = s.columns[0], i && i[s.indent] && (n.value = i[s.indent](n.value, s.component._group.getRowCount(), s.component._group.getData(), s.component)));
    }), t;
  }
  triggerDownload(e, t, i, s, n) {
    var r = document.createElement("a"), a = this.table.options.downloadEncoder(e, t);
    a && (n ? window.open(window.URL.createObjectURL(a)) : (s = s || "Tabulator." + (typeof i == "function" ? "txt" : i), navigator.msSaveOrOpenBlob ? navigator.msSaveOrOpenBlob(a, s) : (r.setAttribute("href", window.URL.createObjectURL(a)), r.setAttribute("download", s), r.style.display = "none", document.body.appendChild(r), r.click(), document.body.removeChild(r))), this.dispatchExternal("downloadComplete"));
  }
  commsReceived(e, t, i) {
    switch (t) {
      case "intercept":
        this.download(i.type, "", i.options, i.active, i.intercept);
        break;
    }
  }
};
R(Ye, "moduleName", "download"), //load defaults
R(Ye, "downloaders", on);
let Yt = Ye;
function Mt(o, e) {
  var t = e.mask, i = typeof e.maskLetterChar < "u" ? e.maskLetterChar : "A", s = typeof e.maskNumberChar < "u" ? e.maskNumberChar : "9", n = typeof e.maskWildcardChar < "u" ? e.maskWildcardChar : "*";
  function r(a) {
    var l = t[a];
    typeof l < "u" && l !== n && l !== i && l !== s && (o.value = o.value + "" + l, r(a + 1));
  }
  o.addEventListener("keydown", (a) => {
    var l = o.value.length, h = a.key;
    if (a.key.length === 1 && !a.ctrlKey && !a.metaKey) {
      if (l >= t.length)
        return a.preventDefault(), a.stopPropagation(), !1;
      switch (t[l]) {
        case i:
          if (h.toUpperCase() == h.toLowerCase())
            return a.preventDefault(), a.stopPropagation(), !1;
          break;
        case s:
          if (isNaN(h))
            return a.preventDefault(), a.stopPropagation(), !1;
          break;
        case n:
          break;
        default:
          if (h !== t[l])
            return a.preventDefault(), a.stopPropagation(), !1;
      }
    }
  }), o.addEventListener("keyup", (a) => {
    a.key.length === 1 && e.maskAutoFill && r(o.value.length);
  }), o.placeholder || (o.placeholder = t), e.maskAutoFill && r(o.value.length);
}
function an(o, e, t, i, s) {
  var n = o.getValue(), r = document.createElement("input");
  if (r.setAttribute("type", s.search ? "search" : "text"), r.style.padding = "4px", r.style.width = "100%", r.style.boxSizing = "border-box", s.elementAttributes && typeof s.elementAttributes == "object")
    for (let l in s.elementAttributes)
      l.charAt(0) == "+" ? (l = l.slice(1), r.setAttribute(l, r.getAttribute(l) + s.elementAttributes["+" + l])) : r.setAttribute(l, s.elementAttributes[l]);
  r.value = s.initialValue ?? (typeof n < "u" ? n : ""), e(function() {
    o.getType() === "cell" && (r.focus({ preventScroll: !0 }), r.style.height = "100%", s.selectContents && r.select());
  });
  function a(l) {
    (n === null || typeof n > "u") && r.value !== "" || r.value !== n ? t(r.value, l) && (n = r.value) : i(l);
  }
  return r.addEventListener("change", a), r.addEventListener("blur", a), r.addEventListener("keydown", function(l) {
    switch (l.key) {
      // case "Tab":
      case "Enter":
        a(l);
        break;
      case "Escape":
        i(l);
        break;
      case "End":
      case "Home":
        l.stopPropagation();
        break;
    }
  }), s.mask && Mt(r, s), r;
}
function ln(o, e, t, i, s) {
  var n = o.getValue(), r = s.verticalNavigation || "hybrid", a = String(n !== null && typeof n < "u" ? n : ""), l = document.createElement("textarea"), h = 0;
  if (l.style.display = "block", l.style.padding = "2px", l.style.height = "100%", l.style.width = "100%", l.style.boxSizing = "border-box", l.style.whiteSpace = "pre-wrap", l.style.resize = "none", s.elementAttributes && typeof s.elementAttributes == "object")
    for (let c in s.elementAttributes)
      c.charAt(0) == "+" ? (c = c.slice(1), l.setAttribute(c, l.getAttribute(c) + s.elementAttributes["+" + c])) : l.setAttribute(c, s.elementAttributes[c]);
  l.value = s.initialValue ?? a, e(function() {
    o.getType() === "cell" && (l.focus({ preventScroll: !0 }), l.style.height = "100%", l.scrollHeight, l.style.height = l.scrollHeight + "px", o.getRow().normalizeHeight(), s.selectContents && l.select());
  });
  function d(c) {
    (n === null || typeof n > "u") && l.value !== "" || l.value !== n ? (t(l.value, c) && (n = l.value), setTimeout(function() {
      o.getRow().normalizeHeight();
    }, 300)) : i(c);
  }
  return l.addEventListener("change", d), l.addEventListener("blur", d), l.addEventListener("keyup", function() {
    l.style.height = "";
    var c = l.scrollHeight;
    l.style.height = c + "px", c != h && (h = c, o.getRow().normalizeHeight());
  }), l.addEventListener("keydown", function(c) {
    switch (c.key) {
      case "Enter":
        c.shiftKey && s.shiftEnterSubmit ? d(c) : c.shiftKey && s.shiftEnterNewLine || c.altKey && s.altEnterNewLine || c.ctrlKey && s.ctrlEnterNewLine || c.metaKey && s.metaEnterNewLine ? (c.preventDefault(), l.setRangeText(`
`, l.selectionStart, l.selectionEnd, "end")) : s.enterSubmit && (c.preventDefault(), d(c));
        break;
      case "Escape":
        i(c);
        break;
      case "ArrowUp":
        (r == "editor" || r == "hybrid" && l.selectionStart) && (c.stopImmediatePropagation(), c.stopPropagation());
        break;
      case "ArrowDown":
        (r == "editor" || r == "hybrid" && l.selectionStart !== l.value.length) && (c.stopImmediatePropagation(), c.stopPropagation());
        break;
      case "End":
      case "Home":
        c.stopPropagation();
        break;
    }
  }), s.mask && Mt(l, s), l;
}
function hn(o, e, t, i, s) {
  var n = o.getValue(), r = s.verticalNavigation || "editor", a = document.createElement("input");
  if (a.setAttribute("type", "number"), typeof s.max < "u" && a.setAttribute("max", s.max), typeof s.min < "u" && a.setAttribute("min", s.min), typeof s.step < "u" && a.setAttribute("step", s.step), a.style.padding = "4px", a.style.width = "100%", a.style.boxSizing = "border-box", s.elementAttributes && typeof s.elementAttributes == "object")
    for (let d in s.elementAttributes)
      d.charAt(0) == "+" ? (d = d.slice(1), a.setAttribute(d, a.getAttribute(d) + s.elementAttributes["+" + d])) : a.setAttribute(d, s.elementAttributes[d]);
  a.value = n;
  var l = function(d) {
    h(d);
  };
  e(function() {
    o.getType() === "cell" && (a.removeEventListener("blur", l), a.focus({ preventScroll: !0 }), a.style.height = "100%", a.addEventListener("blur", l), s.selectContents && a.select());
  });
  function h(d) {
    var c = a.value;
    !isNaN(c) && c !== "" && (c = Number(c)), c !== n ? t(c, d) && (n = c) : i(d);
  }
  return a.addEventListener("keydown", function(d) {
    switch (d.key) {
      case "Enter":
        h(d);
        break;
      case "Escape":
        i(d);
        break;
      case "ArrowUp":
      case "ArrowDown":
        r == "editor" && (d.stopImmediatePropagation(), d.stopPropagation());
        break;
      case "End":
      case "Home":
        d.stopPropagation();
        break;
    }
  }), s.mask && Mt(a, s), a;
}
function dn(o, e, t, i, s) {
  var n = o.getValue(), r = document.createElement("input");
  if (r.setAttribute("type", "range"), typeof s.max < "u" && r.setAttribute("max", s.max), typeof s.min < "u" && r.setAttribute("min", s.min), typeof s.step < "u" && r.setAttribute("step", s.step), r.style.padding = "4px", r.style.width = "100%", r.style.boxSizing = "border-box", s.elementAttributes && typeof s.elementAttributes == "object")
    for (let l in s.elementAttributes)
      l.charAt(0) == "+" ? (l = l.slice(1), r.setAttribute(l, r.getAttribute(l) + s.elementAttributes["+" + l])) : r.setAttribute(l, s.elementAttributes[l]);
  r.value = n, e(function() {
    o.getType() === "cell" && (r.focus({ preventScroll: !0 }), r.style.height = "100%");
  });
  function a(l) {
    var h = r.value;
    !isNaN(h) && h !== "" && (h = Number(h)), h != n ? t(h, l) && (n = h) : i(l);
  }
  return r.addEventListener("blur", function(l) {
    a(l);
  }), r.addEventListener("keydown", function(l) {
    switch (l.key) {
      case "Enter":
        a(l);
        break;
      case "Escape":
        i(l);
        break;
    }
  }), r;
}
function un(o, e, t, i, s) {
  var n = s.format, r = s.verticalNavigation || "editor", a = n ? window.DateTime || luxon.DateTime : null, l = o.getValue(), h = document.createElement("input");
  function d(u) {
    var f;
    return a.isDateTime(u) ? f = u : n === "x" ? f = a.fromMillis(u) : n === "iso" ? f = a.fromISO(String(u)) : f = a.fromFormat(String(u), n), f.toFormat("yyyy-MM-dd");
  }
  if (h.type = "date", h.style.padding = "4px", h.style.width = "100%", h.style.boxSizing = "border-box", s.max && h.setAttribute("max", n ? d(s.max) : s.max), s.min && h.setAttribute("min", n ? d(s.min) : s.min), s.elementAttributes && typeof s.elementAttributes == "object")
    for (let u in s.elementAttributes)
      u.charAt(0) == "+" ? (u = u.slice(1), h.setAttribute(u, h.getAttribute(u) + s.elementAttributes["+" + u])) : h.setAttribute(u, s.elementAttributes[u]);
  l = typeof l < "u" ? l : "", n && (a ? l = d(l) : console.error("Editor Error - 'date' editor 'format' param is dependant on luxon.js")), h.value = l, e(function() {
    o.getType() === "cell" && (h.focus({ preventScroll: !0 }), h.style.height = "100%", s.selectContents && h.select());
  });
  function c(u) {
    var f = h.value, m;
    if ((l === null || typeof l > "u") && f !== "" || f !== l) {
      if (f && n)
        switch (m = a.fromFormat(String(f), "yyyy-MM-dd"), n) {
          case !0:
            f = m;
            break;
          case "x":
            f = m.toMillis();
            break;
          case "iso":
            f = m.toISO();
            break;
          default:
            f = m.toFormat(n);
        }
      t(f, u) && (l = h.value);
    } else
      i(u);
  }
  return h.addEventListener("blur", function(u) {
    (u.relatedTarget || u.rangeParent || u.explicitOriginalTarget !== h) && c(u);
  }), h.addEventListener("keydown", function(u) {
    switch (u.key) {
      // case "Tab":
      case "Enter":
        c(u);
        break;
      case "Escape":
        i(u);
        break;
      case "End":
      case "Home":
        u.stopPropagation();
        break;
      case "ArrowUp":
      case "ArrowDown":
        r == "editor" && (u.stopImmediatePropagation(), u.stopPropagation());
        break;
    }
  }), h;
}
function cn(o, e, t, i, s) {
  var n = s.format, r = s.verticalNavigation || "editor", a = n ? window.DateTime || luxon.DateTime : null, l, h = o.getValue(), d = document.createElement("input");
  if (d.type = "time", d.style.padding = "4px", d.style.width = "100%", d.style.boxSizing = "border-box", s.elementAttributes && typeof s.elementAttributes == "object")
    for (let u in s.elementAttributes)
      u.charAt(0) == "+" ? (u = u.slice(1), d.setAttribute(u, d.getAttribute(u) + s.elementAttributes["+" + u])) : d.setAttribute(u, s.elementAttributes[u]);
  h = typeof h < "u" ? h : "", n && (a ? (a.isDateTime(h) ? l = h : n === "x" ? l = a.fromMillis(h) : n === "iso" ? l = a.fromISO(String(h)) : l = a.fromFormat(String(h), n), h = l.toFormat("HH:mm")) : console.error("Editor Error - 'date' editor 'format' param is dependant on luxon.js")), d.value = h, e(function() {
    o.getType() == "cell" && (d.focus({ preventScroll: !0 }), d.style.height = "100%", s.selectContents && d.select());
  });
  function c(u) {
    var f = d.value, m;
    if ((h === null || typeof h > "u") && f !== "" || f !== h) {
      if (f && n)
        switch (m = a.fromFormat(String(f), "hh:mm"), n) {
          case !0:
            f = m;
            break;
          case "x":
            f = m.toMillis();
            break;
          case "iso":
            f = m.toISO();
            break;
          default:
            f = m.toFormat(n);
        }
      t(f, u) && (h = d.value);
    } else
      i(u);
  }
  return d.addEventListener("blur", function(u) {
    (u.relatedTarget || u.rangeParent || u.explicitOriginalTarget !== d) && c(u);
  }), d.addEventListener("keydown", function(u) {
    switch (u.key) {
      // case "Tab":
      case "Enter":
        c(u);
        break;
      case "Escape":
        i(u);
        break;
      case "End":
      case "Home":
        u.stopPropagation();
        break;
      case "ArrowUp":
      case "ArrowDown":
        r == "editor" && (u.stopImmediatePropagation(), u.stopPropagation());
        break;
    }
  }), d;
}
function fn(o, e, t, i, s) {
  var n = s.format, r = s.verticalNavigation || "editor", a = n ? this.table.dependencyRegistry.lookup(["luxon", "DateTime"], "DateTime") : null, l, h = o.getValue(), d = document.createElement("input");
  if (d.type = "datetime-local", d.style.padding = "4px", d.style.width = "100%", d.style.boxSizing = "border-box", s.elementAttributes && typeof s.elementAttributes == "object")
    for (let u in s.elementAttributes)
      u.charAt(0) == "+" ? (u = u.slice(1), d.setAttribute(u, d.getAttribute(u) + s.elementAttributes["+" + u])) : d.setAttribute(u, s.elementAttributes[u]);
  h = typeof h < "u" ? h : "", n && (a ? (a.isDateTime(h) ? l = h : n === "x" ? l = a.fromMillis(h) : n === "iso" ? l = a.fromISO(String(h)) : l = a.fromFormat(String(h), n), h = l.toFormat("yyyy-MM-dd") + "T" + l.toFormat("HH:mm")) : console.error("Editor Error - 'date' editor 'format' param is dependant on luxon.js")), d.value = h, e(function() {
    o.getType() === "cell" && (d.focus({ preventScroll: !0 }), d.style.height = "100%", s.selectContents && d.select());
  });
  function c(u) {
    var f = d.value, m;
    if ((h === null || typeof h > "u") && f !== "" || f !== h) {
      if (f && n)
        switch (m = a.fromISO(String(f)), n) {
          case !0:
            f = m;
            break;
          case "x":
            f = m.toMillis();
            break;
          case "iso":
            f = m.toISO();
            break;
          default:
            f = m.toFormat(n);
        }
      t(f, u) && (h = d.value);
    } else
      i(u);
  }
  return d.addEventListener("blur", function(u) {
    (u.relatedTarget || u.rangeParent || u.explicitOriginalTarget !== d) && c(u);
  }), d.addEventListener("keydown", function(u) {
    switch (u.key) {
      // case "Tab":
      case "Enter":
        c(u);
        break;
      case "Escape":
        i(u);
        break;
      case "End":
      case "Home":
        u.stopPropagation();
        break;
      case "ArrowUp":
      case "ArrowDown":
        r == "editor" && (u.stopImmediatePropagation(), u.stopPropagation());
        break;
    }
  }), d;
}
let pn = class {
  constructor(e, t, i, s, n, r) {
    this.edit = e, this.table = e.table, this.cell = t, this.params = this._initializeParams(r), this.data = [], this.displayItems = [], this.currentItems = [], this.focusedItem = null, this.input = this._createInputElement(), this.listEl = this._createListElement(), this.initialValues = null, this.isFilter = t.getType() === "header", this.filterTimeout = null, this.filtered = !1, this.typing = !1, this.values = [], this.popup = null, this.listIteration = 0, this.lastAction = "", this.filterTerm = "", this.blurable = !0, this.actions = {
      success: s,
      cancel: n
    }, this._deprecatedOptionsCheck(), this._initializeValue(), i(this._onRendered.bind(this));
  }
  _deprecatedOptionsCheck() {
  }
  _initializeValue() {
    var e = this.cell.getValue();
    typeof e > "u" && typeof this.params.defaultValue < "u" && (e = this.params.defaultValue), this.initialValues = this.params.multiselect ? e : [e], this.isFilter && (this.input.value = this.initialValues ? this.initialValues.join(",") : "", this.headerFilterInitialListGen());
  }
  _onRendered() {
    var e = this.cell.getElement();
    function t(i) {
      i.stopPropagation();
    }
    this.isFilter || (this.input.style.height = "100%", this.input.focus({ preventScroll: !0 })), e.addEventListener("click", t), setTimeout(() => {
      e.removeEventListener("click", t);
    }, 1e3), this.input.addEventListener("mousedown", this._preventPopupBlur.bind(this));
  }
  _createListElement() {
    var e = document.createElement("div");
    return e.classList.add("tabulator-edit-list"), e.addEventListener("mousedown", this._preventBlur.bind(this)), e.addEventListener("keydown", this._inputKeyDown.bind(this)), e;
  }
  _setListWidth() {
    var e = this.isFilter ? this.input : this.cell.getElement();
    this.listEl.style.minWidth = e.offsetWidth + "px", this.params.maxWidth && (this.params.maxWidth === !0 ? this.listEl.style.maxWidth = e.offsetWidth + "px" : typeof this.params.maxWidth == "number" ? this.listEl.style.maxWidth = this.params.maxWidth + "px" : this.listEl.style.maxWidth = this.params.maxWidth);
  }
  _createInputElement() {
    var e = this.params.elementAttributes, t = document.createElement("input");
    if (t.setAttribute("type", this.params.clearable ? "search" : "text"), t.style.padding = "4px", t.style.width = "100%", t.style.boxSizing = "border-box", this.params.autocomplete || (t.style.cursor = "default", t.style.caretColor = "transparent"), e && typeof e == "object")
      for (let i in e)
        i.charAt(0) == "+" ? (i = i.slice(1), t.setAttribute(i, t.getAttribute(i) + e["+" + i])) : t.setAttribute(i, e[i]);
    return this.params.mask && Mt(t, this.params), this._bindInputEvents(t), t;
  }
  _initializeParams(e) {
    var t = ["values", "valuesURL", "valuesLookup"], i;
    return e = Object.assign({}, e), e.verticalNavigation = e.verticalNavigation || "editor", e.placeholderLoading = typeof e.placeholderLoading > "u" ? "Searching ..." : e.placeholderLoading, e.placeholderEmpty = typeof e.placeholderEmpty > "u" ? "No Results Found" : e.placeholderEmpty, e.filterDelay = typeof e.filterDelay > "u" ? 300 : e.filterDelay, e.emptyValue = Object.keys(e).includes("emptyValue") ? e.emptyValue : "", i = Object.keys(e).filter((s) => t.includes(s)).length, i ? i > 1 && console.warn("list editor config error - only one of the values, valuesURL, or valuesLookup options can be set on the same editor") : console.warn("list editor config error - either the values, valuesURL, or valuesLookup option must be set"), e.autocomplete ? e.multiselect && (e.multiselect = !1, console.warn("list editor config error - multiselect option is not available when autocomplete is enabled")) : (e.freetext && (e.freetext = !1, console.warn("list editor config error - freetext option is only available when autocomplete is enabled")), e.filterFunc && (e.filterFunc = !1, console.warn("list editor config error - filterFunc option is only available when autocomplete is enabled")), e.filterRemote && (e.filterRemote = !1, console.warn("list editor config error - filterRemote option is only available when autocomplete is enabled")), e.mask && (e.mask = !1, console.warn("list editor config error - mask option is only available when autocomplete is enabled")), e.allowEmpty && (e.allowEmpty = !1, console.warn("list editor config error - allowEmpty option is only available when autocomplete is enabled")), e.listOnEmpty && (e.listOnEmpty = !1, console.warn("list editor config error - listOnEmpty option is only available when autocomplete is enabled"))), e.filterRemote && !(typeof e.valuesLookup == "function" || e.valuesURL) && (e.filterRemote = !1, console.warn("list editor config error - filterRemote option should only be used when values list is populated from a remote source")), e;
  }
  //////////////////////////////////////
  ////////// Event Handling ////////////
  //////////////////////////////////////
  _bindInputEvents(e) {
    e.addEventListener("focus", this._inputFocus.bind(this)), e.addEventListener("click", this._inputClick.bind(this)), e.addEventListener("blur", this._inputBlur.bind(this)), e.addEventListener("keydown", this._inputKeyDown.bind(this)), e.addEventListener("search", this._inputSearch.bind(this)), this.params.autocomplete && e.addEventListener("keyup", this._inputKeyUp.bind(this));
  }
  _inputFocus(e) {
    this.rebuildOptionsList();
  }
  _filter() {
    this.params.filterRemote ? (clearTimeout(this.filterTimeout), this.filterTimeout = setTimeout(() => {
      this.rebuildOptionsList();
    }, this.params.filterDelay)) : this._filterList();
  }
  _inputClick(e) {
    e.stopPropagation();
  }
  _inputBlur(e) {
    this.blurable && (this.popup ? this.popup.hide() : this._resolveValue(!0, e));
  }
  _inputSearch() {
    this._clearChoices();
  }
  _inputKeyDown(e) {
    switch (e.key) {
      case "ArrowUp":
        this._keyUp(e);
        break;
      case "ArrowDown":
        this._keyDown(e);
        break;
      case "ArrowLeft":
      case "ArrowRight":
        this._keySide(e);
        break;
      case "Enter":
        this._keyEnter(e);
        break;
      case "Escape":
        this._keyEsc(e);
        break;
      case "Home":
      case "End":
        this._keyHomeEnd(e);
        break;
      case "Tab":
        this._keyTab(e);
        break;
      default:
        this._keySelectLetter(e);
    }
  }
  _inputKeyUp(e) {
    switch (e.key) {
      case "ArrowUp":
      case "ArrowLeft":
      case "ArrowRight":
      case "ArrowDown":
      case "Enter":
      case "Escape":
        break;
      default:
        this._keyAutoCompLetter(e);
    }
  }
  _preventPopupBlur() {
    this.popup && this.popup.blockHide(), setTimeout(() => {
      this.popup && this.popup.restoreHide();
    }, 10);
  }
  _preventBlur() {
    this.blurable = !1, setTimeout(() => {
      this.blurable = !0;
    }, 10);
  }
  //////////////////////////////////////
  //////// Keyboard Navigation /////////
  //////////////////////////////////////
  _keyTab(e) {
    this.params.autocomplete && this.lastAction === "typing" ? this._resolveValue(!0, e) : this.focusedItem && this._chooseItem(this.focusedItem, !0);
  }
  _keyUp(e) {
    var t = this.displayItems.indexOf(this.focusedItem);
    (this.params.verticalNavigation == "editor" || this.params.verticalNavigation == "hybrid" && t) && (e.stopImmediatePropagation(), e.stopPropagation(), e.preventDefault(), t > 0 && this._focusItem(this.displayItems[t - 1]));
  }
  _keyDown(e) {
    var t = this.displayItems.indexOf(this.focusedItem);
    (this.params.verticalNavigation == "editor" || this.params.verticalNavigation == "hybrid" && t < this.displayItems.length - 1) && (e.stopImmediatePropagation(), e.stopPropagation(), e.preventDefault(), t < this.displayItems.length - 1 && (t == -1 ? this._focusItem(this.displayItems[0]) : this._focusItem(this.displayItems[t + 1])));
  }
  _keySide(e) {
    this.params.autocomplete || (e.stopImmediatePropagation(), e.stopPropagation(), e.preventDefault());
  }
  _keyEnter(e) {
    this.params.autocomplete && this.lastAction === "typing" ? this._resolveValue(!0, e) : this.focusedItem && (this.isFilter && !this.params.multiselect && this.focusedItem.selected ? this._resolveValue(!1, e) : this._chooseItem(this.focusedItem, !1, e));
  }
  _keyEsc(e) {
    this._cancel(e);
  }
  _keyHomeEnd(e) {
    this.params.autocomplete && e.stopImmediatePropagation();
  }
  _keySelectLetter(e) {
    this.params.autocomplete || (e.preventDefault(), e.key.length === 1 && this._scrollToValue(e.key.toUpperCase().charCodeAt(0)));
  }
  _keyAutoCompLetter(e) {
    this._filter(), this.lastAction = "typing", this.typing = !0;
  }
  _scrollToValue(e) {
    clearTimeout(this.filterTimeout);
    var t = String.fromCharCode(e).toLowerCase();
    this.filterTerm += t.toLowerCase();
    var i = this.displayItems.find((s) => typeof s.label < "u" && s.label.toLowerCase().startsWith(this.filterTerm));
    i && this._focusItem(i), this.filterTimeout = setTimeout(() => {
      this.filterTerm = "";
    }, 800);
  }
  _focusItem(e) {
    this.lastAction = "focus", this.focusedItem && this.focusedItem.element && this.focusedItem.element.classList.remove("focused"), this.focusedItem = e, e && e.element && (e.element.classList.add("focused"), e.element.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" }));
  }
  //////////////////////////////////////
  /////// Data List Generation /////////
  //////////////////////////////////////
  headerFilterInitialListGen() {
    this._generateOptions(!0);
  }
  rebuildOptionsList() {
    this._generateOptions().then(this._sortOptions.bind(this)).then(this._buildList.bind(this)).then(this._showList.bind(this)).catch((e) => {
      Number.isInteger(e) || console.error("List generation error", e);
    });
  }
  _filterList() {
    this._buildList(this._filterOptions()), this._showList();
  }
  _generateOptions(e) {
    var t = [], i = ++this.listIteration;
    return this.filtered = !1, this.params.values ? t = this.params.values : this.params.valuesURL ? t = this._ajaxRequest(this.params.valuesURL, this.input.value) : typeof this.params.valuesLookup == "function" ? t = this.params.valuesLookup(this.cell, this.input.value) : this.params.valuesLookup && (t = this._uniqueColumnValues(this.params.valuesLookupField)), t instanceof Promise ? (e || this._addPlaceholder(this.params.placeholderLoading), t.then().then((s) => this.listIteration === i ? this._parseList(s) : Promise.reject(i))) : Promise.resolve(this._parseList(t));
  }
  _addPlaceholder(e) {
    var t = document.createElement("div");
    typeof e == "function" && (e = e(this.cell.getComponent(), this.listEl)), e && (this._clearList(), e instanceof HTMLElement ? t = e : (t.classList.add("tabulator-edit-list-placeholder"), t.innerHTML = e), this.listEl.appendChild(t), this._showList());
  }
  _ajaxRequest(e, t) {
    var i = this.params.filterRemote ? { term: t } : {};
    return e = Ui(e, {}, i), fetch(e).then((s) => s.ok ? s.json().catch((n) => (console.warn("List Ajax Load Error - Invalid JSON returned", n), Promise.reject(n))) : (console.error("List Ajax Load Error - Connection Error: " + s.status, s.statusText), Promise.reject(s))).catch((s) => (console.error("List Ajax Load Error - Connection Error: ", s), Promise.reject(s)));
  }
  _uniqueColumnValues(e) {
    var t = {}, i = this.table.getData(this.params.valuesLookup), s;
    return e ? s = this.table.columnManager.getColumnByField(e) : s = this.cell.getColumn()._getSelf(), s ? i.forEach((n) => {
      var r = s.getFieldValue(n);
      this._emptyValueCheck(r) || (this.params.multiselect && Array.isArray(r) ? r.forEach((a) => {
        this._emptyValueCheck(a) || (t[a] = !0);
      }) : t[r] = !0);
    }) : (console.warn("unable to find matching column to create select lookup list:", e), t = []), Object.keys(t);
  }
  _emptyValueCheck(e) {
    return e === null || typeof e > "u" || e === "";
  }
  _parseList(e) {
    var t = [];
    return Array.isArray(e) || (e = Object.entries(e).map(([i, s]) => ({
      label: s,
      value: i
    }))), e.forEach((i) => {
      typeof i != "object" && (i = {
        label: i,
        value: i
      }), this._parseListItem(i, t, 0);
    }), !this.currentItems.length && this.params.freetext && (this.input.value = this.initialValues, this.typing = !0, this.lastAction = "typing"), this.params.multiselect && (this.initialValues = null), this.data = t, t;
  }
  _parseListItem(e, t, i) {
    var s = {};
    if (e.options)
      s = this._parseListGroup(e, i + 1);
    else if (s = {
      label: e.label,
      value: e.value,
      itemParams: e.itemParams,
      elementAttributes: e.elementAttributes,
      element: !1,
      selected: !1,
      visible: !0,
      level: i,
      original: e
    }, this.params.multiselect) {
      var n = this.currentItems.findIndex((r) => r.value === e.value);
      n > -1 ? (this.focusedItem === this.currentItems[n] && (this.focusedItem = s), this.currentItems[n] = s, s.selected = !0) : this.initialValues && this.initialValues.indexOf(e.value) > -1 && this._chooseItem(s, !0);
    } else this.initialValues && this.initialValues.indexOf(e.value) > -1 && this._chooseItem(s, !0);
    t.push(s);
  }
  _parseListGroup(e, t) {
    var i = {
      label: e.label,
      group: !0,
      itemParams: e.itemParams,
      elementAttributes: e.elementAttributes,
      element: !1,
      visible: !0,
      level: t,
      options: [],
      original: e
    };
    return e.options.forEach((s) => {
      this._parseListItem(s, i.options, t);
    }), i;
  }
  _sortOptions(e) {
    var t;
    return this.params.sort && (t = typeof this.params.sort == "function" ? this.params.sort : this._defaultSortFunction.bind(this), this._sortGroup(t, e)), e;
  }
  _sortGroup(e, t) {
    t.sort((i, s) => e(i.label, s.label, i.value, s.value, i.original, s.original)), t.forEach((i) => {
      i.group && this._sortGroup(e, i.options);
    });
  }
  _defaultSortFunction(e, t) {
    var i, s, n, r, a = 0, l, h = /(\d+)|(\D+)/g, d = /\d/, c = 0;
    if (this.params.sort === "desc" && ([e, t] = [t, e]), !e && e !== 0)
      c = !t && t !== 0 ? 0 : -1;
    else if (!t && t !== 0)
      c = 1;
    else {
      if (isFinite(e) && isFinite(t)) return e - t;
      if (i = String(e).toLowerCase(), s = String(t).toLowerCase(), i === s) return 0;
      if (!(d.test(i) && d.test(s))) return i > s ? 1 : -1;
      for (i = i.match(h), s = s.match(h), l = i.length > s.length ? s.length : i.length; a < l; )
        if (n = i[a], r = s[a++], n !== r)
          return isFinite(n) && isFinite(r) ? (n.charAt(0) === "0" && (n = "." + n), r.charAt(0) === "0" && (r = "." + r), n - r) : n > r ? 1 : -1;
      return i.length > s.length;
    }
    return c;
  }
  _filterOptions() {
    var e = this.params.filterFunc || this._defaultFilterFunc, t = this.input.value;
    return t ? (this.filtered = !0, this.data.forEach((i) => {
      this._filterItem(e, t, i);
    })) : this.filtered = !1, this.data;
  }
  _filterItem(e, t, i) {
    var s = !1;
    return i.group ? (i.options.forEach((n) => {
      this._filterItem(e, t, n) && (s = !0);
    }), i.visible = s) : i.visible = e(t, i.label, i.value, i.original), i.visible;
  }
  _defaultFilterFunc(e, t, i, s) {
    return e = String(e).toLowerCase(), t !== null && typeof t < "u" && (String(t).toLowerCase().indexOf(e) > -1 || String(i).toLowerCase().indexOf(e) > -1);
  }
  //////////////////////////////////////
  /////////// Display List /////////////
  //////////////////////////////////////
  _clearList() {
    for (; this.listEl.firstChild; ) this.listEl.removeChild(this.listEl.firstChild);
    this.displayItems = [];
  }
  _buildList(e) {
    this._clearList(), e.forEach((t) => {
      this._buildItem(t);
    }), this.displayItems.length || this._addPlaceholder(this.params.placeholderEmpty);
  }
  _buildItem(e) {
    var t = e.element, i;
    if (!this.filtered || e.visible) {
      if (!t) {
        if (t = document.createElement("div"), t.tabIndex = 0, i = this.params.itemFormatter ? this.params.itemFormatter(e.label, e.value, e.original, t) : e.label, i instanceof HTMLElement ? t.appendChild(i) : t.innerHTML = i, e.group ? t.classList.add("tabulator-edit-list-group") : t.classList.add("tabulator-edit-list-item"), t.classList.add("tabulator-edit-list-group-level-" + e.level), e.elementAttributes && typeof e.elementAttributes == "object")
          for (let s in e.elementAttributes)
            s.charAt(0) == "+" ? (s = s.slice(1), t.setAttribute(s, this.input.getAttribute(s) + e.elementAttributes["+" + s])) : t.setAttribute(s, e.elementAttributes[s]);
        e.group ? t.addEventListener("click", this._groupClick.bind(this, e)) : t.addEventListener("click", this._itemClick.bind(this, e)), t.addEventListener("mousedown", this._preventBlur.bind(this)), e.element = t;
      }
      this._styleItem(e), this.listEl.appendChild(t), e.group ? e.options.forEach((s) => {
        this._buildItem(s);
      }) : this.displayItems.push(e);
    }
  }
  _showList() {
    var e = this.popup && this.popup.isVisible();
    if (this.input.parentNode) {
      if (this.params.autocomplete && this.input.value === "" && !this.params.listOnEmpty) {
        this.popup && this.popup.hide(!0);
        return;
      }
      this._setListWidth(), this.popup || (this.popup = this.edit.popup(this.listEl)), this.popup.show(this.cell.getElement(), "bottom"), e || setTimeout(() => {
        this.popup.hideOnBlur(this._resolveValue.bind(this, !0));
      }, 10);
    }
  }
  _styleItem(e) {
    e && e.element && (e.selected ? e.element.classList.add("active") : e.element.classList.remove("active"));
  }
  //////////////////////////////////////
  ///////// User Interaction ///////////
  //////////////////////////////////////
  _itemClick(e, t) {
    t.stopPropagation(), this._chooseItem(e, !1, t);
  }
  _groupClick(e, t) {
    t.stopPropagation();
  }
  //////////////////////////////////////
  ////// Current Item Management ///////
  //////////////////////////////////////
  _cancel(e) {
    this.popup.hide(!0), this.actions.cancel(e);
  }
  _clearChoices() {
    this.typing = !0, this.currentItems.forEach((e) => {
      e.selected = !1, this._styleItem(e);
    }), this.currentItems = [], this.focusedItem = null;
  }
  _chooseItem(e, t, i) {
    var s;
    if (this.typing = !1, this.params.multiselect)
      s = this.currentItems.indexOf(e), s > -1 ? (this.currentItems.splice(s, 1), e.selected = !1) : (this.currentItems.push(e), e.selected = !0), this.input.value = this.currentItems.map((n) => n.label).join(","), this._styleItem(e);
    else {
      if (this.isFilter && !t && e.selected) {
        this._clearChoices(), this.input.value = "", this._resolveValue(!1, i);
        return;
      }
      this.currentItems = [e], e.selected = !0, this.input.value = e.label, this._styleItem(e), t || this._resolveValue(!1, i);
    }
    this._focusItem(e);
  }
  _resolveValue(e, t) {
    var i, s;
    if (this.popup && this.popup.hide(!0), this.params.multiselect)
      i = this.currentItems.map((n) => n.value);
    else if (e && this.params.autocomplete && this.typing)
      if (this.params.freetext || this.params.allowEmpty && this.input.value === "")
        i = this.input.value;
      else {
        this.actions.cancel(t);
        return;
      }
    else
      this.currentItems[0] ? i = this.currentItems[0].value : this.isFilter && this.focusedItem && this.focusedItem.selected ? i = this.focusedItem.value : (s = Array.isArray(this.initialValues) ? this.initialValues[0] : this.initialValues, s === null || typeof s > "u" || s === "" ? i = s : i = this.params.emptyValue);
    i === "" && (i = this.params.emptyValue), this.actions.success(i, t), this.isFilter && (this.initialValues = i && !Array.isArray(i) ? [i] : i, this.currentItems = []);
  }
};
function mn(o, e, t, i, s) {
  var n = new pn(this, o, e, t, i, s);
  return n.input;
}
function gn(o, e, t, i, s) {
  var n = this, r = o.getElement(), a = o.getValue(), l = r.getElementsByTagName("svg").length || 5, h = r.getElementsByTagName("svg")[0] ? r.getElementsByTagName("svg")[0].getAttribute("width") : 14, d = [], c = document.createElement("div"), u = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  function f(b) {
    d.forEach(function(k, S) {
      S < b ? (n.table.browser == "ie" ? k.setAttribute("class", "tabulator-star-active") : k.classList.replace("tabulator-star-inactive", "tabulator-star-active"), k.innerHTML = '<polygon fill="#488CE9" stroke="#014AAE" stroke-width="37.6152" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" points="259.216,29.942 330.27,173.919 489.16,197.007 374.185,309.08 401.33,467.31 259.216,392.612 117.104,467.31 144.25,309.08 29.274,197.007 188.165,173.919 "/>') : (n.table.browser == "ie" ? k.setAttribute("class", "tabulator-star-inactive") : k.classList.replace("tabulator-star-active", "tabulator-star-inactive"), k.innerHTML = '<polygon fill="#010155" stroke="#686868" stroke-width="37.6152" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" points="259.216,29.942 330.27,173.919 489.16,197.007 374.185,309.08 401.33,467.31 259.216,392.612 117.104,467.31 144.25,309.08 29.274,197.007 188.165,173.919 "/>');
    });
  }
  function m(b) {
    var k = document.createElement("span"), S = u.cloneNode(!0);
    d.push(S), k.addEventListener("mouseenter", function(F) {
      F.stopPropagation(), F.stopImmediatePropagation(), f(b);
    }), k.addEventListener("mousemove", function(F) {
      F.stopPropagation(), F.stopImmediatePropagation();
    }), k.addEventListener("click", function(F) {
      F.stopPropagation(), F.stopImmediatePropagation(), t(b, F), r.blur();
    }), k.appendChild(S), c.appendChild(k);
  }
  function p(b) {
    a = b, f(b);
  }
  if (r.style.whiteSpace = "nowrap", r.style.overflow = "hidden", r.style.textOverflow = "ellipsis", c.style.verticalAlign = "middle", c.style.display = "inline-block", c.style.padding = "4px", u.setAttribute("width", h), u.setAttribute("height", h), u.setAttribute("viewBox", "0 0 512 512"), u.setAttribute("xml:space", "preserve"), u.style.padding = "0 1px", s.elementAttributes && typeof s.elementAttributes == "object")
    for (let b in s.elementAttributes)
      b.charAt(0) == "+" ? (b = b.slice(1), c.setAttribute(b, c.getAttribute(b) + s.elementAttributes["+" + b])) : c.setAttribute(b, s.elementAttributes[b]);
  for (var v = 1; v <= l; v++)
    m(v);
  return a = Math.min(parseInt(a), l), f(a), c.addEventListener("mousemove", function(b) {
    f(0);
  }), c.addEventListener("click", function(b) {
    t(0, b);
  }), r.addEventListener("blur", function(b) {
    i(b);
  }), r.addEventListener("keydown", function(b) {
    switch (b.key) {
      case "ArrowRight":
        p(a + 1);
        break;
      case "ArrowLeft":
        p(a - 1);
        break;
      case "Enter":
        t(a, b);
        break;
      case "Escape":
        i(b);
        break;
    }
  }), c;
}
function bn(o, e, t, i, s) {
  var n = o.getElement(), r = typeof s.max > "u" ? n.getElementsByTagName("div")[0] && n.getElementsByTagName("div")[0].getAttribute("max") || 100 : s.max, a = typeof s.min > "u" ? n.getElementsByTagName("div")[0] && n.getElementsByTagName("div")[0].getAttribute("min") || 0 : s.min, l = (r - a) / 100, h = o.getValue() || 0, d = document.createElement("div"), c = document.createElement("div"), u, f;
  function m(p) {
    var v = window.getComputedStyle(n, null), b = l * Math.round(c.offsetWidth / ((n.clientWidth - parseInt(v.getPropertyValue("padding-left")) - parseInt(v.getPropertyValue("padding-right"))) / 100)) + a;
    t(b, p), n.setAttribute("aria-valuenow", b), n.setAttribute("aria-label", h);
  }
  if (d.style.position = "absolute", d.style.right = "0", d.style.top = "0", d.style.bottom = "0", d.style.width = "5px", d.classList.add("tabulator-progress-handle"), c.style.display = "inline-block", c.style.position = "relative", c.style.height = "100%", c.style.backgroundColor = "#488CE9", c.style.maxWidth = "100%", c.style.minWidth = "0%", s.elementAttributes && typeof s.elementAttributes == "object")
    for (let p in s.elementAttributes)
      p.charAt(0) == "+" ? (p = p.slice(1), c.setAttribute(p, c.getAttribute(p) + s.elementAttributes["+" + p])) : c.setAttribute(p, s.elementAttributes[p]);
  return n.style.padding = "4px 4px", h = Math.min(parseFloat(h), r), h = Math.max(parseFloat(h), a), h = Math.round((h - a) / l), c.style.width = h + "%", n.setAttribute("aria-valuemin", a), n.setAttribute("aria-valuemax", r), c.appendChild(d), d.addEventListener("mousedown", function(p) {
    u = p.screenX, f = c.offsetWidth;
  }), d.addEventListener("mouseover", function() {
    d.style.cursor = "ew-resize";
  }), n.addEventListener("mousemove", function(p) {
    u && (c.style.width = f + p.screenX - u + "px");
  }), n.addEventListener("mouseup", function(p) {
    u && (p.stopPropagation(), p.stopImmediatePropagation(), u = !1, f = !1, m(p));
  }), n.addEventListener("keydown", function(p) {
    switch (p.key) {
      case "ArrowRight":
        p.preventDefault(), c.style.width = c.clientWidth + n.clientWidth / 100 + "px";
        break;
      case "ArrowLeft":
        p.preventDefault(), c.style.width = c.clientWidth - n.clientWidth / 100 + "px";
        break;
      case "Tab":
      case "Enter":
        m(p);
        break;
      case "Escape":
        i(p);
        break;
    }
  }), n.addEventListener("blur", function(p) {
    i(p);
  }), c;
}
function vn(o, e, t, i, s) {
  var n = o.getValue(), r = document.createElement("input"), a = s.tristate, l = typeof s.indeterminateValue > "u" ? null : s.indeterminateValue, h = !1, d = Object.keys(s).includes("trueValue"), c = Object.keys(s).includes("falseValue");
  if (r.setAttribute("type", "checkbox"), r.style.marginTop = "5px", r.style.boxSizing = "border-box", s.elementAttributes && typeof s.elementAttributes == "object")
    for (let f in s.elementAttributes)
      f.charAt(0) == "+" ? (f = f.slice(1), r.setAttribute(f, r.getAttribute(f) + s.elementAttributes["+" + f])) : r.setAttribute(f, s.elementAttributes[f]);
  r.value = n, a && (typeof n > "u" || n === l || n === "") && (h = !0, r.indeterminate = !0), this.table.browser != "firefox" && this.table.browser != "safari" && e(function() {
    o.getType() === "cell" && r.focus({ preventScroll: !0 });
  }), r.checked = d ? n === s.trueValue : n === !0 || n === "true" || n === "True" || n === 1;
  function u(f) {
    var m = r.checked;
    return d && m ? m = s.trueValue : c && !m && (m = s.falseValue), a ? f ? h ? l : m : r.checked && !h ? (r.checked = !1, r.indeterminate = !0, h = !0, l) : (h = !1, m) : m;
  }
  return r.addEventListener("change", function(f) {
    t(u(), f);
  }), r.addEventListener("blur", function(f) {
    t(u(!0), f);
  }), r.addEventListener("keydown", function(f) {
    f.key == "Enter" && t(u(), f), f.key == "Escape" && i(f);
  }), r;
}
function wn(o, e, t, i, s) {
  var n = o._getSelf().column, r, a, l;
  function h(d) {
    var c = d.getValue(), u = "input";
    switch (typeof c) {
      case "number":
        u = "number";
        break;
      case "boolean":
        u = "tickCross";
        break;
      case "string":
        c.includes(`
`) && (u = "textarea");
        break;
    }
    return u;
  }
  return r = s.editorLookup ? s.editorLookup(o) : h(o), s.paramsLookup && (l = typeof s.paramsLookup == "function" ? s.paramsLookup(r, o) : s.paramsLookup[r]), a = this.table.modules.edit.lookupEditor(r, n), a.call(this, o, e, t, i, l || {});
}
var Cn = {
  input: an,
  textarea: ln,
  number: hn,
  range: dn,
  date: un,
  time: cn,
  datetime: fn,
  list: mn,
  star: gn,
  progress: bn,
  tickCross: vn,
  adaptable: wn
};
const ot = class ot extends B {
  constructor(e) {
    super(e), this.currentCell = !1, this.mouseClick = !1, this.recursionBlock = !1, this.invalidEdit = !1, this.editedCells = [], this.convertEmptyValues = !1, this.editors = ot.editors, this.registerTableOption("editTriggerEvent", "focus"), this.registerTableOption("editorEmptyValue"), this.registerTableOption("editorEmptyValueFunc", this.emptyValueCheck.bind(this)), this.registerColumnOption("editable"), this.registerColumnOption("editor"), this.registerColumnOption("editorParams"), this.registerColumnOption("editorEmptyValue"), this.registerColumnOption("editorEmptyValueFunc"), this.registerColumnOption("cellEditing"), this.registerColumnOption("cellEdited"), this.registerColumnOption("cellEditCancelled"), this.registerTableFunction("getEditedCells", this.getEditedCells.bind(this)), this.registerTableFunction("clearCellEdited", this.clearCellEdited.bind(this)), this.registerTableFunction("setCellEdited", this.setCellEdited.bind(this)), this.registerTableFunction("navigatePrev", this.navigatePrev.bind(this)), this.registerTableFunction("navigateNext", this.navigateNext.bind(this)), this.registerTableFunction("navigateLeft", this.navigateLeft.bind(this)), this.registerTableFunction("navigateRight", this.navigateRight.bind(this)), this.registerTableFunction("navigateUp", this.navigateUp.bind(this)), this.registerTableFunction("navigateDown", this.navigateDown.bind(this)), this.registerComponentFunction("cell", "isEdited", this.cellIsEdited.bind(this)), this.registerComponentFunction("cell", "clearEdited", this.clearEdited.bind(this)), this.registerComponentFunction("cell", "setEdited", this.setEdited.bind(this)), this.registerComponentFunction("cell", "edit", this.editCell.bind(this)), this.registerComponentFunction("cell", "cancelEdit", this.cellCancelEdit.bind(this)), this.registerComponentFunction("cell", "navigatePrev", this.navigatePrev.bind(this)), this.registerComponentFunction("cell", "navigateNext", this.navigateNext.bind(this)), this.registerComponentFunction("cell", "navigateLeft", this.navigateLeft.bind(this)), this.registerComponentFunction("cell", "navigateRight", this.navigateRight.bind(this)), this.registerComponentFunction("cell", "navigateUp", this.navigateUp.bind(this)), this.registerComponentFunction("cell", "navigateDown", this.navigateDown.bind(this));
  }
  initialize() {
    this.subscribe("cell-init", this.bindEditor.bind(this)), this.subscribe("cell-delete", this.clearEdited.bind(this)), this.subscribe("cell-value-changed", this.updateCellClass.bind(this)), this.subscribe("column-layout", this.initializeColumnCheck.bind(this)), this.subscribe("column-delete", this.columnDeleteCheck.bind(this)), this.subscribe("row-deleting", this.rowDeleteCheck.bind(this)), this.subscribe("row-layout", this.rowEditableCheck.bind(this)), this.subscribe("data-refreshing", this.cancelEdit.bind(this)), this.subscribe("clipboard-paste", this.pasteBlocker.bind(this)), this.confirm("edit-nav-disabled") || (this.subscribe("keybinding-nav-prev", this.navigatePrev.bind(this, void 0)), this.subscribe("keybinding-nav-next", this.keybindingNavigateNext.bind(this)), this.subscribe("keybinding-nav-up", this.navigateUp.bind(this, void 0)), this.subscribe("keybinding-nav-down", this.navigateDown.bind(this, void 0))), this.subscribe("edit-check-editing", this.checkEditing.bind(this)), this.subscribe("edit-cancel-cell", this.cancelEditEvent.bind(this)), Object.keys(this.table.options).includes("editorEmptyValue") && (this.convertEmptyValues = !0);
  }
  ///////////////////////////////////
  ///////// Paste Negation //////////
  ///////////////////////////////////
  pasteBlocker(e) {
    if (this.currentCell)
      return !0;
  }
  ///////////////////////////////////
  ////// Keybinding Functions ///////
  ///////////////////////////////////
  keybindingNavigateNext(e) {
    var t = this.currentCell, i = this.options("tabEndNewRow");
    t && (this.navigateNext(t, e) || i && (t.getElement().firstChild.blur(), this.invalidEdit || (i === !0 ? i = this.table.addRow({}) : typeof i == "function" ? i = this.table.addRow(i(t.row.getComponent())) : i = this.table.addRow(Object.assign({}, i)), i.then(() => {
      setTimeout(() => {
        t.getComponent().navigateNext();
      });
    }))));
  }
  ///////////////////////////////////
  ///////// Cell Functions //////////
  ///////////////////////////////////
  cellIsEdited(e) {
    return !!e.modules.edit && e.modules.edit.edited;
  }
  cellCancelEdit(e) {
    e === this.currentCell ? this.table.modules.edit.cancelEdit() : console.warn("Cancel Editor Error - This cell is not currently being edited ");
  }
  ///////////////////////////////////
  ///////// Table Functions /////////
  ///////////////////////////////////
  updateCellClass(e) {
    this.allowEdit(e) ? e.getElement().classList.add("tabulator-editable") : e.getElement().classList.remove("tabulator-editable");
  }
  clearCellEdited(e) {
    e || (e = this.table.modules.edit.getEditedCells()), Array.isArray(e) || (e = [e]), e.forEach((t) => {
      this.table.modules.edit.clearEdited(t._getSelf());
    });
  }
  //mark cells as edited programmatically, mirrors clearCellEdited
  //https://github.com/tabulator-tables/tabulator/issues/4443
  setCellEdited(e) {
    e && (Array.isArray(e) || (e = [e]), e.forEach((t) => {
      this.table.modules.edit.setEdited(t._getSelf());
    }));
  }
  navigatePrev(e = this.currentCell, t) {
    var i, s;
    if (e) {
      if (t && t.preventDefault(), i = this.navigateLeft(), i)
        return !0;
      if (s = this.table.rowManager.prevDisplayRow(e.row, !0), s && (i = this.findPrevEditableCell(s, s.cells.length), i))
        return i.getComponent().edit(), !0;
    }
    return !1;
  }
  navigateNext(e = this.currentCell, t) {
    var i, s;
    if (e) {
      if (t && t.preventDefault(), i = this.navigateRight(), i)
        return !0;
      if (s = this.table.rowManager.nextDisplayRow(e.row, !0), s && (i = this.findNextEditableCell(s, -1), i))
        return i.getComponent().edit(), !0;
    }
    return !1;
  }
  navigateLeft(e = this.currentCell, t) {
    var i, s;
    return e && (t && t.preventDefault(), i = e.getIndex(), s = this.findPrevEditableCell(e.row, i), s) ? (s.getComponent().edit(), !0) : !1;
  }
  navigateRight(e = this.currentCell, t) {
    var i, s;
    return e && (t && t.preventDefault(), i = e.getIndex(), s = this.findNextEditableCell(e.row, i), s) ? (s.getComponent().edit(), !0) : !1;
  }
  navigateUp(e = this.currentCell, t) {
    var i, s;
    return e && (t && t.preventDefault(), i = e.getIndex(), s = this.table.rowManager.prevDisplayRow(e.row, !0), s) ? (s.cells[i].getComponent().edit(), !0) : !1;
  }
  navigateDown(e = this.currentCell, t) {
    var i, s;
    return e && (t && t.preventDefault(), i = e.getIndex(), s = this.table.rowManager.nextDisplayRow(e.row, !0), s) ? (s.cells[i].getComponent().edit(), !0) : !1;
  }
  findNextEditableCell(e, t) {
    var i = !1;
    if (t < e.cells.length - 1)
      for (var s = t + 1; s < e.cells.length; s++) {
        let n = e.cells[s];
        if (n.column.modules.edit && K.elVisible(n.getElement()) && this.allowEdit(n)) {
          i = n;
          break;
        }
      }
    return i;
  }
  findPrevEditableCell(e, t) {
    var i = !1;
    if (t > 0)
      for (var s = t - 1; s >= 0; s--) {
        let n = e.cells[s];
        if (n.column.modules.edit && K.elVisible(n.getElement()) && this.allowEdit(n)) {
          i = n;
          break;
        }
      }
    return i;
  }
  ///////////////////////////////////
  ///////// Internal Logic //////////
  ///////////////////////////////////
  initializeColumnCheck(e) {
    typeof e.definition.editor < "u" && this.initializeColumn(e);
  }
  columnDeleteCheck(e) {
    this.currentCell && this.currentCell.column === e && this.cancelEdit();
  }
  rowDeleteCheck(e) {
    this.currentCell && this.currentCell.row === e && this.cancelEdit();
  }
  rowEditableCheck(e) {
    e.getCells().forEach((t) => {
      t.column.modules.edit && typeof t.column.modules.edit.check == "function" && this.updateCellClass(t);
    });
  }
  //initialize column editor
  initializeColumn(e) {
    var t = Object.keys(e.definition).includes("editorEmptyValue"), i = {
      editor: !1,
      blocked: !1,
      check: e.definition.editable,
      params: e.definition.editorParams || {},
      convertEmptyValues: t,
      editorEmptyValue: e.definition.editorEmptyValue,
      editorEmptyValueFunc: e.definition.editorEmptyValueFunc
    };
    i.editor = this.lookupEditor(e.definition.editor, e), i.editor && (e.modules.edit = i);
  }
  lookupEditor(e, t) {
    var i;
    switch (typeof e) {
      case "string":
        this.editors[e] ? i = this.editors[e] : console.warn("Editor Error - No such editor found: ", e);
        break;
      case "function":
        i = e;
        break;
      case "boolean":
        e === !0 && (typeof t.definition.formatter != "function" ? this.editors[t.definition.formatter] ? i = this.editors[t.definition.formatter] : i = this.editors.input : console.warn("Editor Error - Cannot auto lookup editor for a custom formatter: ", t.definition.formatter));
        break;
    }
    return i;
  }
  getCurrentCell() {
    return this.currentCell ? this.currentCell.getComponent() : !1;
  }
  checkEditing() {
    return !!this.currentCell;
  }
  cancelEditEvent() {
    return this.currentCell ? (this.cancelEdit(), !0) : !1;
  }
  /**
   * @param {KeyboardEvent|MouseEvent|FocusEvent|Event} [e] editor event that ended the edit
   */
  clearEditor(e, t) {
    var i = this.currentCell, s;
    if (this.invalidEdit = !1, i) {
      for (this.currentCell = !1, s = i.getElement(), this.dispatch("edit-editor-clear", i, e, t), s.classList.remove("tabulator-editing"); s.firstChild; ) s.removeChild(s.firstChild);
      i.row.getElement().classList.remove("tabulator-editing"), i.table.element.classList.remove("tabulator-editing");
    }
    this.table.getRedrawBlock() && this.table.restoreRedraw();
  }
  /**
   * @param {KeyboardEvent|MouseEvent|FocusEvent|Event} [e] editor event that ended the edit
   */
  cancelEdit(e) {
    if (this.currentCell) {
      var t = this.currentCell, i = this.currentCell.getComponent();
      this.clearEditor(!0, e), t.setValueActual(t.getValue()), t.cellRendered(), (t.column.definition.editor == "textarea" || t.column.definition.variableHeight) && t.row.normalizeHeight(!0), t.column.definition.cellEditCancelled && t.column.definition.cellEditCancelled.call(this.table, i), this.dispatch("edit-cancelled", t), this.dispatchExternal("cellEditCancelled", i);
    }
  }
  //return a formatted value for a cell
  bindEditor(e) {
    if (e.column.modules.edit) {
      var t = this, i = e.getElement(!0);
      this.updateCellClass(e), i.setAttribute("tabindex", 0), i.addEventListener("mousedown", function(s) {
        s.button === 2 ? s.preventDefault() : t.mouseClick = !0;
      }), this.options("editTriggerEvent") === "dblclick" && i.addEventListener("dblclick", function(s) {
        i.classList.contains("tabulator-editing") || (i.focus({ preventScroll: !0 }), t.edit(e, s, !1));
      }), (this.options("editTriggerEvent") === "focus" || this.options("editTriggerEvent") === "click") && i.addEventListener("click", function(s) {
        i.classList.contains("tabulator-editing") || (i.focus({ preventScroll: !0 }), t.edit(e, s, !1));
      }), this.options("editTriggerEvent") === "focus" && i.addEventListener("focus", function(s) {
        t.recursionBlock || t.edit(e, s, !1);
      });
    }
  }
  focusCellNoEvent(e, t) {
    this.recursionBlock = !0, t && this.table.browser === "ie" || e.getElement().focus({ preventScroll: !0 }), this.recursionBlock = !1;
  }
  editCell(e, t, i) {
    this.focusCellNoEvent(e), this.edit(e, !1, t, i);
  }
  focusScrollAdjust(e) {
    if (this.table.rowManager.getRenderMode() == "virtual") {
      var t = this.table.rowManager.element.scrollTop, i = this.table.rowManager.element.clientHeight + this.table.rowManager.element.scrollTop, s = e.row.getElement();
      s.offsetTop < t ? this.table.rowManager.element.scrollTop -= t - s.offsetTop : s.offsetTop + s.offsetHeight > i && (this.table.rowManager.element.scrollTop += s.offsetTop + s.offsetHeight - i);
      var n = this.table.rowManager.element.scrollLeft, r = this.table.rowManager.element.clientWidth + this.table.rowManager.element.scrollLeft, a = e.getElement();
      this.table.modExists("frozenColumns") && (n += parseInt(this.table.modules.frozenColumns.leftMargin || 0), r -= parseInt(this.table.modules.frozenColumns.rightMargin || 0)), this.table.options.renderHorizontal === "virtual" && (n -= parseInt(this.table.columnManager.renderer.vDomPadLeft), r -= parseInt(this.table.columnManager.renderer.vDomPadLeft)), a.offsetLeft < n ? this.table.rowManager.element.scrollLeft -= n - a.offsetLeft : a.offsetLeft + a.offsetWidth > r && (this.table.rowManager.element.scrollLeft += a.offsetLeft + a.offsetWidth - r);
    }
  }
  allowEdit(e) {
    var t = !!e.column.modules.edit;
    if (e.column.modules.edit)
      switch (typeof e.column.modules.edit.check) {
        case "function":
          e.row.initialized && (t = e.column.modules.edit.check(e.getComponent()));
          break;
        case "string":
          t = !!e.row.data[e.column.modules.edit.check];
          break;
        case "boolean":
          t = e.column.modules.edit.check;
          break;
      }
    return t;
  }
  edit(e, t, i, s) {
    var n = this, r = !0, a = function() {
    }, l = e.getElement(), h = !1, d, c, u;
    if (this.currentCell) {
      if (this.invalidEdit || this.currentCell === e)
        return;
      this.cancelEdit();
    }
    function f(k, S) {
      if (n.currentCell === e && !h) {
        var F = n.chain("edit-success", [e, k], !0, !0);
        return F === !0 || n.table.options.validationMode === "highlight" ? (h = !0, n.clearEditor(!1, S), e.modules.edit || (e.modules.edit = {}), e.modules.edit.edited = !0, n.editedCells.indexOf(e) == -1 && n.editedCells.push(e), k = n.transformEmptyValues(k, e), e.setValue(k, !0), F === !0) : (h = !0, n.invalidEdit = !0, n.focusCellNoEvent(e, !0), a(), setTimeout(() => {
          h = !1;
        }, 10), !1);
      }
    }
    function m(k) {
      n.currentCell === e && !h && n.cancelEdit(k);
    }
    function p(k) {
      a = k;
    }
    if (e.column.modules.edit.blocked)
      return this.mouseClick = !1, this.blur(l), !1;
    if (r = this.allowEdit(e), r || i) {
      if (t && t.stopPropagation(), n.cancelEdit(), n.currentCell = e, this.focusScrollAdjust(e), c = e.getComponent(), this.mouseClick && (this.mouseClick = !1, e.column.definition.cellClick && e.column.definition.cellClick.call(this.table, t, c)), e.column.definition.cellEditing && e.column.definition.cellEditing.call(this.table, c), this.dispatch("cell-editing", e), this.dispatchExternal("cellEditing", c), u = typeof e.column.modules.edit.params == "function" ? e.column.modules.edit.params(c) : e.column.modules.edit.params, s && (u = { ...u, ...s }), d = e.column.modules.edit.editor.call(n, c, p, f, m, u), this.currentCell && d !== !1)
        if (d instanceof Node) {
          for (this.dispatch("edit-editor-created", e, d), l.classList.add("tabulator-editing"), e.row.getElement().classList.add("tabulator-editing"), e.table.element.classList.add("tabulator-editing"); l.firstChild; ) l.removeChild(l.firstChild);
          l.appendChild(d), this.table.blockRedraw(), a();
          for (var v = l.children, b = 0; b < v.length; b++)
            v[b].addEventListener("click", function(k) {
              k.stopPropagation();
            }), v[b].addEventListener("mousedown", function(k) {
              k.stopPropagation();
            }), v[b].addEventListener("mouseup", function(k) {
              k.stopPropagation();
            });
        } else
          return console.warn("Edit Error - Editor should return an instance of Node, the editor returned:", d), this.blur(l), !1;
      else
        return this.blur(l), !1;
      return !0;
    } else
      return this.mouseClick = !1, this.blur(l), !1;
  }
  emptyValueCheck(e) {
    return e === "" || e === null || typeof e > "u";
  }
  transformEmptyValues(e, t) {
    var i = t.column.modules.edit, s = i.convertEmptyValues || this.convertEmptyValues, n;
    return s && (n = i.editorEmptyValueFunc || this.options("editorEmptyValueFunc"), n && n(e) && (e = i.convertEmptyValues ? i.editorEmptyValue : this.options("editorEmptyValue"))), e;
  }
  blur(e) {
    this.confirm("edit-blur", [e]) || e.blur();
  }
  getEditedCells() {
    var e = [];
    return this.editedCells.forEach((t) => {
      e.push(t.getComponent());
    }), e;
  }
  clearEdited(e) {
    var t;
    e.modules.edit && e.modules.edit.edited && (e.modules.edit.edited = !1, this.dispatch("edit-edited-clear", e)), t = this.editedCells.indexOf(e), t > -1 && this.editedCells.splice(t, 1);
  }
  //mark a cell as edited without a user edit, mirrors clearEdited
  //https://github.com/tabulator-tables/tabulator/issues/4443
  setEdited(e) {
    e.modules.edit || (e.modules.edit = {}), e.modules.edit.edited || (e.modules.edit.edited = !0, this.dispatch("edit-edited-set", e)), this.editedCells.indexOf(e) == -1 && this.editedCells.push(e);
  }
};
R(ot, "moduleName", "edit"), //load defaults
R(ot, "editors", Cn);
let Zt = ot;
class Oi {
  constructor(e, t, i, s) {
    this.type = e, this.columns = t, this.component = i || !1, this.indent = s || 0;
  }
}
class Wt {
  constructor(e, t, i, s, n) {
    this.value = e, this.component = t || !1, this.width = i, this.height = s, this.depth = n;
  }
}
var En = {}, yn = {
  visible: function() {
    return this.rowManager.getVisibleRows(!1, !0);
  },
  all: function() {
    return this.rowManager.rows;
  },
  selected: function() {
    return this.modules.selectRow.selectedRows;
  },
  active: function() {
    return this.options.pagination ? this.rowManager.getDisplayRows(this.rowManager.displayRows.length - 2) : this.rowManager.getDisplayRows();
  }
};
const ze = class ze extends B {
  constructor(e) {
    super(e), this.config = {}, this.cloneTableStyle = !0, this.colVisProp = "", this.colVisPropAttach = "", this.registerTableOption("htmlOutputConfig", !1), this.registerColumnOption("htmlOutput"), this.registerColumnOption("titleHtmlOutput");
  }
  initialize() {
    this.registerTableFunction("getHtml", this.getHtml.bind(this));
  }
  ///////////////////////////////////
  ///////// Internal Logic //////////
  ///////////////////////////////////
  generateExportList(e, t, i, s) {
    var n, r, a, l;
    return this.cloneTableStyle = t, this.config = e || {}, this.colVisProp = s, this.colVisPropAttach = this.colVisProp.charAt(0).toUpperCase() + this.colVisProp.slice(1), l = ze.columnLookups[i], l && (a = l.call(this.table), a = a.filter((h) => this.columnVisCheck(h))), n = this.config.columnHeaders !== !1 ? this.headersToExportRows(this.generateColumnGroupHeaders(a)) : [], a && (a = a.map((h) => h.getComponent())), r = this.bodyToExportRows(this.rowLookup(i), a), n.concat(r);
  }
  generateTable(e, t, i, s) {
    var n = this.generateExportList(e, t, i, s);
    return this.generateTableElement(n);
  }
  rowLookup(e) {
    var t = [], i;
    return typeof e == "function" ? e.call(this.table).forEach((s) => {
      s = this.table.rowManager.findRow(s), s && t.push(s);
    }) : (i = ze.rowLookups[e] || ze.rowLookups.active, t = i.call(this.table)), Object.assign([], t);
  }
  generateColumnGroupHeaders(e) {
    var t = [];
    return e || (e = this.config.columnGroups !== !1 ? this.table.columnManager.columns : this.table.columnManager.columnsByIndex), e.forEach((i) => {
      var s = this.processColumnGroup(i);
      s && t.push(s);
    }), t;
  }
  processColumnGroup(e) {
    var t = e.columns, i = 0, s = e.definition["title" + this.colVisPropAttach] || e.definition.title, n = {
      title: s,
      column: e,
      depth: 1
    };
    if (t.length) {
      if (n.subGroups = [], n.width = 0, t.forEach((r) => {
        var a = this.processColumnGroup(r);
        a && (n.width += a.width, n.subGroups.push(a), a.depth > i && (i = a.depth));
      }), n.depth += i, !n.width)
        return !1;
    } else if (this.columnVisCheck(e))
      n.width = 1;
    else
      return !1;
    return n;
  }
  columnVisCheck(e) {
    var t = e.definition[this.colVisProp];
    return this.config.rowHeaders === !1 && e.isRowHeader ? !1 : (typeof t == "function" && (t = t.call(this.table, e.getComponent())), t === !1 || t === !0 ? t : e.visible && e.field);
  }
  headersToExportRows(e) {
    var t = [], i = 0, s = [];
    function n(r, a) {
      var l = i - a;
      if (typeof t[a] > "u" && (t[a] = []), r.height = r.subGroups ? 1 : l - r.depth + 1, t[a].push(r), r.height > 1)
        for (let h = 1; h < r.height; h++)
          typeof t[a + h] > "u" && (t[a + h] = []), t[a + h].push(!1);
      if (r.width > 1)
        for (let h = 1; h < r.width; h++)
          t[a].push(!1);
      r.subGroups && r.subGroups.forEach(function(h) {
        n(h, a + 1);
      });
    }
    return e.forEach(function(r) {
      r.depth > i && (i = r.depth);
    }), e.forEach(function(r) {
      n(r, 0);
    }), t.forEach((r) => {
      var a = [];
      r.forEach((l) => {
        if (l) {
          let h = typeof l.title > "u" ? "" : l.title;
          a.push(new Wt(h, l.column.getComponent(), l.width, l.height, l.depth));
        } else
          a.push(null);
      }), s.push(new Oi("header", a));
    }), s;
  }
  bodyToExportRows(e, t = []) {
    var i = [];
    return t.length === 0 && this.table.columnManager.columnsByIndex.forEach((s) => {
      this.columnVisCheck(s) && t.push(s.getComponent());
    }), this.config.columnCalcs !== !1 && this.table.modExists("columnCalcs") && (this.table.modules.columnCalcs.topInitialized && e.unshift(this.table.modules.columnCalcs.topRow), this.table.modules.columnCalcs.botInitialized && e.push(this.table.modules.columnCalcs.botRow)), e = e.filter((s) => {
      switch (s.type) {
        case "group":
          return this.config.rowGroups !== !1;
        case "calc":
          return this.config.columnCalcs !== !1;
        case "row":
          return !(this.table.options.dataTree && this.config.dataTree === !1 && s.modules.dataTree.parent);
      }
      return !0;
    }), e.forEach((s, n) => {
      var r = s.getData(this.colVisProp), a = [], l = 0;
      switch (s.type) {
        case "group":
          l = s.level, a.push(new Wt(s.key, s.getComponent(), t.length, 1));
          break;
        case "calc":
        case "row":
          t.forEach((h) => {
            a.push(new Wt(h._column.getFieldValue(r), h, 1, 1));
          }), this.table.options.dataTree && this.config.dataTree !== !1 && (l = s.modules.dataTree.index);
          break;
      }
      i.push(new Oi(s.type, a, s.getComponent(), l));
    }), i;
  }
  generateTableElement(e) {
    var t = document.createElement("table"), i = document.createElement("thead"), s = document.createElement("tbody"), n = this.lookupTableStyles(), r = this.table.options["rowFormatter" + this.colVisPropAttach], a = {};
    return a.rowFormatter = r !== null ? r : this.table.options.rowFormatter, this.table.options.dataTree && this.config.dataTree !== !1 && this.table.modExists("columnCalcs") && (a.treeElementField = this.table.modules.dataTree.elementField), a.groupHeader = this.table.options["groupHeader" + this.colVisPropAttach], a.groupHeader && !Array.isArray(a.groupHeader) && (a.groupHeader = [a.groupHeader]), t.classList.add("tabulator-print-table"), this.mapElementStyles(this.table.columnManager.getHeadersElement(), i, ["border-top", "border-left", "border-right", "border-bottom", "background-color", "color", "font-weight", "font-family", "font-size"]), e.length > 1e3 && console.warn("It may take a long time to render an HTML table with more than 1000 rows"), e.forEach((l, h) => {
      let d;
      switch (l.type) {
        case "header":
          i.appendChild(this.generateHeaderElement(l, a, n));
          break;
        case "group":
          s.appendChild(this.generateGroupElement(l, a, n));
          break;
        case "calc":
          s.appendChild(this.generateCalcElement(l, a, n));
          break;
        case "row":
          d = this.generateRowElement(l, a, n), this.mapElementStyles(h % 2 && n.evenRow ? n.evenRow : n.oddRow, d, ["border-top", "border-left", "border-right", "border-bottom", "color", "font-weight", "font-family", "font-size", "background-color"]), s.appendChild(d);
          break;
      }
    }), i.innerHTML && t.appendChild(i), t.appendChild(s), this.mapElementStyles(this.table.element, t, ["border-top", "border-left", "border-right", "border-bottom"]), t;
  }
  lookupTableStyles() {
    var e = {};
    return this.cloneTableStyle && window.getComputedStyle && (e.oddRow = this.table.element.querySelector(".tabulator-row-odd:not(.tabulator-group):not(.tabulator-calcs)"), e.evenRow = this.table.element.querySelector(".tabulator-row-even:not(.tabulator-group):not(.tabulator-calcs)"), e.calcRow = this.table.element.querySelector(".tabulator-row.tabulator-calcs"), e.firstRow = this.table.element.querySelector(".tabulator-row:not(.tabulator-group):not(.tabulator-calcs)"), e.firstGroup = this.table.element.getElementsByClassName("tabulator-group")[0], e.firstRow && (e.styleCells = e.firstRow.getElementsByClassName("tabulator-cell"), e.styleRowHeader = e.firstRow.getElementsByClassName("tabulator-row-header")[0], e.firstCell = e.styleCells[0], e.lastCell = e.styleCells[e.styleCells.length - 1])), e;
  }
  generateHeaderElement(e, t, i) {
    var s = document.createElement("tr");
    return e.columns.forEach((n) => {
      if (n) {
        var r = document.createElement("th"), a = n.component._column.definition.cssClass ? n.component._column.definition.cssClass.split(" ") : [];
        r.colSpan = n.width, r.rowSpan = n.height, r.innerHTML = n.value, this.cloneTableStyle && (r.style.boxSizing = "border-box"), a.forEach(function(l) {
          r.classList.add(l);
        }), this.mapElementStyles(n.component.getElement(), r, ["text-align", "border-left", "border-right", "background-color", "color", "font-weight", "font-family", "font-size"]), this.mapElementStyles(n.component._column.contentElement, r, ["padding-top", "padding-left", "padding-right", "padding-bottom"]), n.component._column.visible ? this.mapElementStyles(n.component.getElement(), r, ["width"]) : n.component._column.definition.width && (r.style.width = n.component._column.definition.width + "px"), n.component._column.parent && n.component._column.parent.isGroup ? this.mapElementStyles(n.component._column.parent.groupElement, r, ["border-top"]) : this.mapElementStyles(n.component.getElement(), r, ["border-top"]), n.component._column.isGroup ? this.mapElementStyles(n.component.getElement(), r, ["border-bottom"]) : this.mapElementStyles(this.table.columnManager.getElement(), r, ["border-bottom"]), s.appendChild(r);
      }
    }), s;
  }
  generateGroupElement(e, t, i) {
    var s = document.createElement("tr"), n = document.createElement("td"), r = e.columns[0];
    return s.classList.add("tabulator-print-table-row"), t.groupHeader && t.groupHeader[e.indent] ? r.value = t.groupHeader[e.indent](r.value, e.component._group.getRowCount(), e.component._group.getData(), e.component) : t.groupHeader !== !1 && (r.value = e.component._group.generator(r.value, e.component._group.getRowCount(), e.component._group.getData(), e.component)), n.colSpan = r.width, n.innerHTML = r.value, s.classList.add("tabulator-print-table-group"), s.classList.add("tabulator-group-level-" + e.indent), r.component.isVisible() && s.classList.add("tabulator-group-visible"), this.mapElementStyles(i.firstGroup, s, ["border-top", "border-left", "border-right", "border-bottom", "color", "font-weight", "font-family", "font-size", "background-color"]), this.mapElementStyles(i.firstGroup, n, ["padding-top", "padding-left", "padding-right", "padding-bottom"]), s.appendChild(n), s;
  }
  generateCalcElement(e, t, i) {
    var s = this.generateRowElement(e, t, i);
    return s.classList.add("tabulator-print-table-calcs"), this.mapElementStyles(i.calcRow, s, ["border-top", "border-left", "border-right", "border-bottom", "color", "font-weight", "font-family", "font-size", "background-color"]), s;
  }
  generateRowElement(e, t, i) {
    var s = document.createElement("tr");
    if (s.classList.add("tabulator-print-table-row"), e.columns.forEach((n, r) => {
      if (n) {
        var a = document.createElement("td"), l = n.component._column, h = this.table, d = h.columnManager.findColumnIndex(l), c = n.value, u, f, m = {
          modules: {},
          getValue: function() {
            return c;
          },
          getField: function() {
            return l.definition.field;
          },
          getElement: function() {
            return a;
          },
          getType: function() {
            return "cell";
          },
          getColumn: function() {
            return l.getComponent();
          },
          getData: function() {
            return e.component.getData();
          },
          getRow: function() {
            return e.component;
          },
          getTable: function() {
            return h;
          },
          getComponent: function() {
            return m;
          },
          column: l
        }, p = l.definition.cssClass ? l.definition.cssClass.split(" ") : [];
        if (p.forEach(function(v) {
          a.classList.add(v);
        }), this.table.modExists("format") && this.config.formatCells !== !1)
          c = this.table.modules.format.formatExportValue(m, this.colVisProp);
        else
          switch (typeof c) {
            case "object":
              c = c !== null ? JSON.stringify(c) : "";
              break;
            case "undefined":
              c = "";
              break;
          }
        c instanceof Node ? a.appendChild(c) : a.innerHTML = c, f = ["padding-top", "padding-left", "padding-right", "padding-bottom", "border-top", "border-left", "border-right", "border-bottom", "color", "font-weight", "font-family", "font-size", "text-align"], l.isRowHeader ? (u = i.styleRowHeader, f.push("background-color")) : u = i.styleCells && i.styleCells[d] ? i.styleCells[d] : i.firstCell, u && (this.mapElementStyles(u, a, f), l.definition.align && (a.style.textAlign = l.definition.align)), this.table.options.dataTree && this.config.dataTree !== !1 && (t.treeElementField && t.treeElementField == l.field || !t.treeElementField && r == 0) && (e.component._row.modules.dataTree.controlEl && a.insertBefore(e.component._row.modules.dataTree.controlEl.cloneNode(!0), a.firstChild), e.component._row.modules.dataTree.branchEl && a.insertBefore(e.component._row.modules.dataTree.branchEl.cloneNode(!0), a.firstChild)), s.appendChild(a), m.modules.format && m.modules.format.renderedCallback && m.modules.format.renderedCallback();
      }
    }), t.rowFormatter && e.type === "row" && this.config.formatCells !== !1) {
      let n = Object.assign(e.component);
      n.getElement = function() {
        return s;
      }, t.rowFormatter(e.component);
    }
    return s;
  }
  generateHTMLTable(e) {
    var t = document.createElement("div");
    return t.appendChild(this.generateTableElement(e)), t.innerHTML;
  }
  getHtml(e, t, i, s) {
    var n = this.generateExportList(i || this.table.options.htmlOutputConfig, t, e, s || "htmlOutput");
    return this.generateHTMLTable(n);
  }
  mapElementStyles(e, t, i) {
    if (this.cloneTableStyle && e && t) {
      var s = {
        "background-color": "backgroundColor",
        color: "fontColor",
        width: "width",
        "font-weight": "fontWeight",
        "font-family": "fontFamily",
        "font-size": "fontSize",
        "text-align": "textAlign",
        "border-top": "borderTop",
        "border-left": "borderLeft",
        "border-right": "borderRight",
        "border-bottom": "borderBottom",
        "padding-top": "paddingTop",
        "padding-left": "paddingLeft",
        "padding-right": "paddingRight",
        "padding-bottom": "paddingBottom"
      };
      if (window.getComputedStyle) {
        var n = window.getComputedStyle(e);
        i.forEach(function(r) {
          t.style[s[r]] || (t.style[s[r]] = n.getPropertyValue(r));
        });
      }
    }
  }
};
R(ze, "moduleName", "export"), R(ze, "columnLookups", En), R(ze, "rowLookups", yn);
let Qt = ze;
var Rn = {
  //equal to
  "=": function(o, e, t, i) {
    return e == o;
  },
  //less than
  "<": function(o, e, t, i) {
    return e < o;
  },
  //less than or equal to
  "<=": function(o, e, t, i) {
    return e <= o;
  },
  //greater than
  ">": function(o, e, t, i) {
    return e > o;
  },
  //greater than or equal to
  ">=": function(o, e, t, i) {
    return e >= o;
  },
  //not equal to
  "!=": function(o, e, t, i) {
    return e != o;
  },
  regex: function(o, e, t, i) {
    return typeof o == "string" && (o = new RegExp(o)), o.test(e);
  },
  //contains the string
  like: function(o, e, t, i) {
    return o === null || typeof o > "u" ? e === o : typeof e < "u" && e !== null ? String(e).toLowerCase().indexOf(o.toLowerCase()) > -1 : !1;
  },
  //contains the keywords
  keywords: function(o, e, t, i) {
    var s = o.toLowerCase().split(typeof i.separator > "u" ? " " : i.separator), n = String(e === null || typeof e > "u" ? "" : e).toLowerCase(), r = [];
    return s.forEach((a) => {
      n.includes(a) && r.push(!0);
    }), i.matchAll ? r.length === s.length : !!r.length;
  },
  //starts with the string
  starts: function(o, e, t, i) {
    return o === null || typeof o > "u" ? e === o : typeof e < "u" && e !== null ? String(e).toLowerCase().startsWith(o.toLowerCase()) : !1;
  },
  //ends with the string
  ends: function(o, e, t, i) {
    return o === null || typeof o > "u" ? e === o : typeof e < "u" && e !== null ? String(e).toLowerCase().endsWith(o.toLowerCase()) : !1;
  },
  //in array
  in: function(o, e, t, i) {
    return Array.isArray(o) ? o.length ? o.indexOf(e) > -1 : !0 : (console.warn("Filter Error - filter value is not an array:", o), !1);
  },
  // Smart filter
  // Supports ., !, <, >, <=, >=, = and falls back to like filter
  smart: function(o, e, t, i) {
    const s = o.trim();
    if (s === ".") return !(e === null || e == "");
    if (s === "!") return e === null || e == "";
    if (s.indexOf("<=") === 0)
      return this["<="](
        parseFloat(s.substring(2)),
        e,
        t,
        i
      );
    if (s.indexOf(">=") === 0)
      return this[">="](
        parseFloat(s.substring(2)),
        e,
        t,
        i
      );
    if (s.indexOf("<") === 0)
      return this["<"](
        parseFloat(s.substring(1)),
        e,
        t,
        i
      );
    if (s.indexOf(">") === 0)
      return this[">"](
        parseFloat(s.substring(1)),
        e,
        t,
        i
      );
    if (s.indexOf("=") === 0)
      return this["="](s.substring(1).trim(), e, t, i);
    if (s.includes(" ")) {
      const n = s.split(/\s+/).filter((r) => r.length > 0);
      if (n.length > 1) {
        const r = n.join(" AND ");
        return this.smarter(r, e, t, i);
      }
    }
    return this.like(s, e, t, i);
  },
  // Smarter filter
  // Just like the smart filter but you can combine multiple filters (AND/OR)
  // Examples:
  // - "john AND smith" - both terms must match
  // - "john OR jane" - either term must match
  // - ">100 AND <500" - value must be between 100 and 500
  // - "! OR foo" - either empty or foo
  smarter: function(o, e, t, i) {
    const s = o.trim();
    if (!s) return !0;
    const n = s.split(/\s+(AND|OR)\s+/i);
    if (n.length === 1)
      return this.smart(s, e, t, i);
    let r = null, a = null;
    for (let l = 0; l < n.length; l++) {
      const h = n[l].trim();
      if (h === "AND" || h === "OR") {
        a = h;
        continue;
      }
      const d = this.smart(h, e, t, i);
      r === null ? r = d : a === "AND" ? r = r && d : a === "OR" && (r = r || d);
    }
    return r !== null ? r : !0;
  }
};
const xe = class xe extends B {
  constructor(e) {
    super(e), this.filterList = [], this.headerFilters = {}, this.headerFilterColumns = [], this.prevHeaderFilterChangeCheck = "", this.prevHeaderFilterChangeCheck = "{}", this.changed = !1, this.tableInitialized = !1, this.registerTableOption("filterMode", "local"), this.registerTableOption("initialFilter", !1), this.registerTableOption("initialHeaderFilter", !1), this.registerTableOption("headerFilterLiveFilterDelay", 300), this.registerTableOption("placeholderHeaderFilter", !1), this.registerColumnOption("headerFilter"), this.registerColumnOption("headerFilterPlaceholder"), this.registerColumnOption("headerFilterParams"), this.registerColumnOption("headerFilterEmptyCheck"), this.registerColumnOption("headerFilterFunc"), this.registerColumnOption("headerFilterFuncParams"), this.registerColumnOption("headerFilterLiveFilter"), this.registerTableFunction("searchRows", this.searchRows.bind(this)), this.registerTableFunction("searchData", this.searchData.bind(this)), this.registerTableFunction("setFilter", this.userSetFilter.bind(this)), this.registerTableFunction("refreshFilter", this.userRefreshFilter.bind(this)), this.registerTableFunction("addFilter", this.userAddFilter.bind(this)), this.registerTableFunction("getFilters", this.getFilters.bind(this)), this.registerTableFunction("setHeaderFilterFocus", this.userSetHeaderFilterFocus.bind(this)), this.registerTableFunction("getHeaderFilterValue", this.userGetHeaderFilterValue.bind(this)), this.registerTableFunction("setHeaderFilterValue", this.userSetHeaderFilterValue.bind(this)), this.registerTableFunction("getHeaderFilters", this.getHeaderFilters.bind(this)), this.registerTableFunction("removeFilter", this.userRemoveFilter.bind(this)), this.registerTableFunction("clearFilter", this.userClearFilter.bind(this)), this.registerTableFunction("clearHeaderFilter", this.userClearHeaderFilter.bind(this)), this.registerComponentFunction("column", "headerFilterFocus", this.setHeaderFilterFocus.bind(this)), this.registerComponentFunction("column", "reloadHeaderFilter", this.reloadHeaderFilter.bind(this)), this.registerComponentFunction("column", "getHeaderFilterValue", this.getHeaderFilterValue.bind(this)), this.registerComponentFunction("column", "setHeaderFilterValue", this.setHeaderFilterValue.bind(this));
  }
  initialize() {
    this.subscribe("column-init", this.initializeColumnHeaderFilter.bind(this)), this.subscribe("column-width-fit-before", this.hideHeaderFilterElements.bind(this)), this.subscribe("column-width-fit-after", this.showHeaderFilterElements.bind(this)), this.subscribe("table-built", this.tableBuilt.bind(this)), this.subscribe("placeholder", this.generatePlaceholder.bind(this)), this.table.options.filterMode === "remote" && this.subscribe("data-params", this.remoteFilterParams.bind(this)), this.registerDataHandler(this.filter.bind(this), 10);
  }
  tableBuilt() {
    this.table.options.initialFilter && this.setFilter(this.table.options.initialFilter), this.table.options.initialHeaderFilter && this.table.options.initialHeaderFilter.forEach((e) => {
      var t = this.table.columnManager.findColumn(e.field);
      if (t)
        this.setHeaderFilterValue(t, e.value);
      else
        return console.warn("Column Filter Error - No matching column found:", e.field), !1;
    }), this.tableInitialized = !0;
  }
  remoteFilterParams(e, t, i, s) {
    return s.filter = this.getFilters(!0, !0), s;
  }
  generatePlaceholder(e) {
    if (this.table.options.placeholderHeaderFilter && Object.keys(this.headerFilters).length)
      return this.table.options.placeholderHeaderFilter;
  }
  ///////////////////////////////////
  ///////// Table Functions /////////
  ///////////////////////////////////
  //set standard filters
  userSetFilter(e, t, i, s) {
    this.setFilter(e, t, i, s), this.refreshFilter();
  }
  //set standard filters
  userRefreshFilter() {
    this.refreshFilter();
  }
  //add filter to array
  userAddFilter(e, t, i, s) {
    this.addFilter(e, t, i, s), this.refreshFilter();
  }
  userSetHeaderFilterFocus(e) {
    var t = this.table.columnManager.findColumn(e);
    if (t)
      this.setHeaderFilterFocus(t);
    else
      return console.warn("Column Filter Focus Error - No matching column found:", e), !1;
  }
  userGetHeaderFilterValue(e) {
    var t = this.table.columnManager.findColumn(e);
    if (t)
      return this.getHeaderFilterValue(t);
    console.warn("Column Filter Error - No matching column found:", e);
  }
  userSetHeaderFilterValue(e, t) {
    var i = this.table.columnManager.findColumn(e);
    if (i)
      this.setHeaderFilterValue(i, t);
    else
      return console.warn("Column Filter Error - No matching column found:", e), !1;
  }
  //remove filter from array
  userRemoveFilter(e, t, i) {
    this.removeFilter(e, t, i), this.refreshFilter();
  }
  //clear filters
  userClearFilter(e) {
    this.clearFilter(e), this.refreshFilter();
  }
  //clear header filters
  userClearHeaderFilter() {
    this.clearHeaderFilter(), this.refreshFilter();
  }
  //search for specific row components
  searchRows(e, t, i) {
    return this.search("rows", e, t, i);
  }
  //search for specific data
  searchData(e, t, i) {
    return this.search("data", e, t, i);
  }
  ///////////////////////////////////
  ///////// Internal Logic //////////
  ///////////////////////////////////
  initializeColumnHeaderFilter(e) {
    var t = e.definition;
    t.headerFilter && this.initializeColumn(e);
  }
  //initialize column header filter
  initializeColumn(e, t) {
    var i = this, s = e.getField();
    function n(r) {
      var a = e.modules.filter.tagType == "input" && e.modules.filter.attrType == "text" || e.modules.filter.tagType == "textarea" ? "partial" : "match", l = "", h = "", d;
      if (typeof e.modules.filter.prevSuccess > "u" || e.modules.filter.prevSuccess !== r) {
        if (e.modules.filter.prevSuccess = r, e.modules.filter.emptyFunc(r))
          delete i.headerFilters[s];
        else {
          switch (e.modules.filter.value = r, typeof e.definition.headerFilterFunc) {
            case "string":
              xe.filters[e.definition.headerFilterFunc] ? (l = e.definition.headerFilterFunc, d = function(c) {
                var u = e.definition.headerFilterFuncParams || {}, f = e.getFieldValue(c);
                return u = typeof u == "function" ? u(r, f, c) : u, xe.filters[e.definition.headerFilterFunc](r, f, c, u);
              }) : console.warn("Header Filter Error - Matching filter function not found: ", e.definition.headerFilterFunc);
              break;
            case "function":
              d = function(c) {
                var u = e.definition.headerFilterFuncParams || {}, f = e.getFieldValue(c);
                return u = typeof u == "function" ? u(r, f, c) : u, e.definition.headerFilterFunc(r, f, c, u);
              }, l = d;
              break;
          }
          if (!d)
            switch (a) {
              case "partial":
                d = function(c) {
                  var u = e.getFieldValue(c);
                  return typeof u < "u" && u !== null ? String(u).toLowerCase().indexOf(String(r).toLowerCase()) > -1 : !1;
                }, l = "like";
                break;
              default:
                d = function(c) {
                  return e.getFieldValue(c) == r;
                }, l = "=";
            }
          i.headerFilters[s] = { value: r, func: d, type: l };
        }
        e.modules.filter.value = r, h = JSON.stringify(i.headerFilters), i.prevHeaderFilterChangeCheck !== h && (i.prevHeaderFilterChangeCheck = h, i.trackChanges(), i.refreshFilter());
      }
      return !0;
    }
    e.modules.filter = {
      success: n,
      attrType: !1,
      tagType: !1,
      emptyFunc: !1
    }, this.generateHeaderFilterElement(e);
  }
  generateHeaderFilterElement(e, t, i) {
    var s = this, n = e.modules.filter.success, r = e.getField(), a, l, h, d, c, u, f, m;
    e.modules.filter.value = t;
    function p() {
    }
    function v(b) {
      m = b;
    }
    if (e.modules.filter.headerElement && e.modules.filter.headerElement.parentNode && e.contentElement.removeChild(e.modules.filter.headerElement.parentNode), r) {
      switch (e.modules.filter.emptyFunc = e.definition.headerFilterEmptyCheck || function(b) {
        return !b && b !== 0;
      }, a = document.createElement("div"), a.classList.add("tabulator-header-filter"), typeof e.definition.headerFilter) {
        case "string":
          s.table.modules.edit.editors[e.definition.headerFilter] ? (l = s.table.modules.edit.editors[e.definition.headerFilter], (e.definition.headerFilter === "tick" || e.definition.headerFilter === "tickCross") && !e.definition.headerFilterEmptyCheck && (e.modules.filter.emptyFunc = function(b) {
            return b !== !0 && b !== !1;
          })) : console.warn("Filter Error - Cannot build header filter, No such editor found: ", e.definition.editor);
          break;
        case "function":
          l = e.definition.headerFilter;
          break;
        case "boolean":
          e.modules.edit && e.modules.edit.editor ? l = e.modules.edit.editor : e.definition.formatter && s.table.modules.edit.editors[e.definition.formatter] ? (l = s.table.modules.edit.editors[e.definition.formatter], (e.definition.formatter === "tick" || e.definition.formatter === "tickCross") && !e.definition.headerFilterEmptyCheck && (e.modules.filter.emptyFunc = function(b) {
            return b !== !0 && b !== !1;
          })) : l = s.table.modules.edit.editors.input;
          break;
      }
      if (l) {
        if (d = {
          getValue: function() {
            return typeof t < "u" ? t : "";
          },
          getField: function() {
            return e.definition.field;
          },
          getElement: function() {
            return a;
          },
          getColumn: function() {
            return e.getComponent();
          },
          getTable: () => this.table,
          getType: () => "header",
          getRow: function() {
            return {
              normalizeHeight: function() {
              }
            };
          }
        }, f = e.definition.headerFilterParams || {}, f = typeof f == "function" ? f.call(s.table, d) : f, h = l.call(this.table.modules.edit, d, v, n, p, f), !h) {
          console.warn("Filter Error - Cannot add filter to " + r + " column, editor returned a value of false");
          return;
        }
        if (!(h instanceof Node)) {
          console.warn("Filter Error - Cannot add filter to " + r + " column, editor should return an instance of Node, the editor returned:", h);
          return;
        }
        s.langBind("headerFilters|columns|" + e.definition.field, function(b) {
          h.setAttribute("placeholder", typeof b < "u" && b ? b : e.definition.headerFilterPlaceholder || s.langText("headerFilters|default"));
        }), h.addEventListener("click", function(b) {
          b.stopPropagation(), h.focus();
        }), h.addEventListener("focus", (b) => {
          var k = this.table.columnManager.contentsElement.scrollLeft, S = this.table.rowManager.element.scrollLeft;
          k !== S && (this.table.rowManager.scrollHorizontal(k), this.table.columnManager.scrollHorizontal(k));
        }), c = !1, u = function(b) {
          c && clearTimeout(c), c = setTimeout(function() {
            n(h.value);
          }, s.table.options.headerFilterLiveFilterDelay);
        }, e.modules.filter.headerElement = h, e.modules.filter.attrType = h.hasAttribute("type") ? h.getAttribute("type").toLowerCase() : "", e.modules.filter.tagType = h.tagName.toLowerCase(), e.definition.headerFilterLiveFilter !== !1 && (e.definition.headerFilter === "autocomplete" || e.definition.headerFilter === "tickCross" || (e.definition.editor === "autocomplete" || e.definition.editor === "tickCross") && e.definition.headerFilter === !0 || (h.addEventListener("keyup", u), h.addEventListener("search", u), e.modules.filter.attrType == "number" && h.addEventListener("change", function(b) {
          n(h.value);
        }), e.modules.filter.attrType == "text" && this.table.browser !== "ie" && h.setAttribute("type", "search")), (e.modules.filter.tagType == "input" || e.modules.filter.tagType == "select" || e.modules.filter.tagType == "textarea") && h.addEventListener("mousedown", function(b) {
          b.stopPropagation();
        })), a.appendChild(h), e.contentElement.appendChild(a), i || s.headerFilterColumns.push(e), m && m();
      }
    } else
      console.warn("Filter Error - Cannot add header filter, column has no field set:", e.definition.title);
  }
  //hide all header filter elements (used to ensure correct column widths in "fitData" layout mode)
  hideHeaderFilterElements() {
    this.headerFilterColumns.forEach(function(e) {
      e.modules.filter && e.modules.filter.headerElement && (e.modules.filter.headerElement.style.display = "none");
    });
  }
  //show all header filter elements (used to ensure correct column widths in "fitData" layout mode)
  showHeaderFilterElements() {
    this.headerFilterColumns.forEach(function(e) {
      e.modules.filter && e.modules.filter.headerElement && (e.modules.filter.headerElement.style.display = "");
    });
  }
  //programmatically set focus of header filter
  setHeaderFilterFocus(e) {
    e.modules.filter && e.modules.filter.headerElement ? e.modules.filter.headerElement.focus() : console.warn("Column Filter Focus Error - No header filter set on column:", e.getField());
  }
  //programmatically get value of header filter
  getHeaderFilterValue(e) {
    if (e.modules.filter && e.modules.filter.headerElement)
      return e.modules.filter.value;
    console.warn("Column Filter Error - No header filter set on column:", e.getField());
  }
  //programmatically set value of header filter
  setHeaderFilterValue(e, t) {
    e && (e.modules.filter && e.modules.filter.headerElement ? (this.generateHeaderFilterElement(e, t, !0), e.modules.filter.success(t)) : console.warn("Column Filter Error - No header filter set on column:", e.getField()));
  }
  reloadHeaderFilter(e) {
    e && (e.modules.filter && e.modules.filter.headerElement ? this.generateHeaderFilterElement(e, e.modules.filter.value, !0) : console.warn("Column Filter Error - No header filter set on column:", e.getField()));
  }
  refreshFilter() {
    this.tableInitialized && (this.table.options.filterMode === "remote" ? this.reloadData(null, !1, !1) : this.refreshData(!0));
  }
  //check if the filters has changed since last use
  trackChanges() {
    this.changed = !0, this.dispatch("filter-changed");
  }
  //check if the filters has changed since last use
  hasChanged() {
    var e = this.changed;
    return this.changed = !1, e;
  }
  //set standard filters
  setFilter(e, t, i, s) {
    this.filterList = [], Array.isArray(e) || (e = [{ field: e, type: t, value: i, params: s }]), this.addFilter(e);
  }
  //add filter to array
  addFilter(e, t, i, s) {
    var n = !1;
    Array.isArray(e) || (e = [{ field: e, type: t, value: i, params: s }]), e.forEach((r) => {
      r = this.findFilter(r), r && (this.filterList.push(r), n = !0);
    }), n && this.trackChanges();
  }
  findFilter(e) {
    var t;
    if (Array.isArray(e))
      return this.findSubFilters(e);
    var i = !1;
    return typeof e.field == "function" ? i = function(s) {
      return e.field(s, e.type || {});
    } : xe.filters[e.type] ? (t = this.table.columnManager.getColumnByField(e.field), t ? i = function(s) {
      return xe.filters[e.type](e.value, t.getFieldValue(s), s, e.params || {});
    } : i = function(s) {
      return xe.filters[e.type](e.value, s[e.field], s, e.params || {});
    }) : console.warn("Filter Error - No such filter type found, ignoring: ", e.type), e.func = i, e.func ? e : !1;
  }
  findSubFilters(e) {
    var t = [];
    return e.forEach((i) => {
      i = this.findFilter(i), i && t.push(i);
    }), t.length ? t : !1;
  }
  //get all filters
  getFilters(e, t) {
    var i = [];
    return e && (i = this.getHeaderFilters()), t && i.forEach(function(s) {
      typeof s.type == "function" && (s.type = "function");
    }), i = i.concat(this.filtersToArray(this.filterList, t)), i;
  }
  //filter to Object
  filtersToArray(e, t) {
    var i = [];
    return e.forEach((s) => {
      var n;
      Array.isArray(s) ? i.push(this.filtersToArray(s, t)) : (n = { field: s.field, type: s.type, value: s.value }, t && typeof n.type == "function" && (n.type = "function"), i.push(n));
    }), i;
  }
  //get all filters
  getHeaderFilters() {
    var e = [];
    for (var t in this.headerFilters)
      e.push({ field: t, type: this.headerFilters[t].type, value: this.headerFilters[t].value });
    return e;
  }
  //remove filter from array
  removeFilter(e, t, i) {
    Array.isArray(e) || (e = [{ field: e, type: t, value: i }]), e.forEach((s) => {
      var n = -1;
      typeof s.field == "object" ? n = this.filterList.findIndex((r) => s === r) : n = this.filterList.findIndex((r) => s.field === r.field && s.type === r.type && s.value === r.value), n > -1 ? this.filterList.splice(n, 1) : console.warn("Filter Error - No matching filter type found, ignoring: ", s.type);
    }), this.trackChanges();
  }
  //clear filters
  clearFilter(e) {
    this.filterList = [], e && this.clearHeaderFilter(), this.trackChanges();
  }
  //clear header filters
  clearHeaderFilter() {
    this.headerFilters = {}, this.prevHeaderFilterChangeCheck = "{}", this.headerFilterColumns.forEach((e) => {
      typeof e.modules.filter.value < "u" && delete e.modules.filter.value, e.modules.filter.prevSuccess = void 0, this.reloadHeaderFilter(e);
    }), this.trackChanges();
  }
  //search data and return matching rows
  search(e, t, i, s) {
    var n = [], r = [];
    return Array.isArray(t) || (t = [{ field: t, type: i, value: s }]), t.forEach((a) => {
      a = this.findFilter(a), a && r.push(a);
    }), this.table.rowManager.rows.forEach((a) => {
      var l = !0;
      r.forEach((h) => {
        this.filterRecurse(h, a.getData()) || (l = !1);
      }), l && n.push(e === "data" ? a.getData("data") : a.getComponent());
    }), n;
  }
  //filter row array
  filter(e, t) {
    var i = [], s = [];
    return this.subscribedExternal("dataFiltering") && this.dispatchExternal("dataFiltering", this.getFilters(!0)), this.table.options.filterMode !== "remote" && (this.filterList.length || Object.keys(this.headerFilters).length) ? e.forEach((n) => {
      this.filterRow(n) && i.push(n);
    }) : i = e.slice(0), this.subscribedExternal("dataFiltered") && (i.forEach((n) => {
      s.push(n.getComponent());
    }), this.dispatchExternal("dataFiltered", this.getFilters(!0), s)), i;
  }
  //filter individual row
  filterRow(e, t) {
    var i = !0, s = e.getData();
    this.filterList.forEach((r) => {
      this.filterRecurse(r, s) || (i = !1);
    });
    for (var n in this.headerFilters)
      this.headerFilters[n].func(s) || (i = !1);
    return i;
  }
  filterRecurse(e, t) {
    var i = !1;
    return Array.isArray(e) ? e.forEach((s) => {
      this.filterRecurse(s, t) && (i = !0);
    }) : i = e.func(t), i;
  }
};
R(xe, "moduleName", "filter"), //load defaults
R(xe, "filters", Rn);
let ei = xe;
function xn(o, e, t) {
  return this.emptyToSpace(this.sanitizeHTML(o.getValue()));
}
function kn(o, e, t) {
  return o.getValue();
}
function Tn(o, e, t) {
  return o.getElement().style.whiteSpace = "pre-wrap", this.emptyToSpace(this.sanitizeHTML(o.getValue()));
}
function Mn(o, e, t) {
  var i = parseFloat(o.getValue()), s = "", n, r, a, l, h, d = e.decimal || ".", c = e.thousand || ",", u = e.negativeSign || "-", f = e.symbol || "", m = !!e.symbolAfter, p = typeof e.precision < "u" ? e.precision : 2;
  if (Number.isNaN(i))
    return this.emptyToSpace(this.sanitizeHTML(o.getValue()));
  if (i < 0 && (i = Math.abs(i), s = u), n = p !== !1 ? i.toFixed(p) : i, n = String(n).split("."), r = n[0], a = n.length > 1 ? d + n[1] : "", e.thousand !== !1)
    for (l = /(\d+)(\d{3})/; l.test(r); )
      r = r.replace(l, "$1" + c + "$2");
  return h = r + a, s === !0 ? (h = "(" + h + ")", m ? h + f : f + h) : m ? s + h + f : s + f + h;
}
function Ln(o, e, t) {
  var i = o.getValue(), s = e.urlPrefix || "", n = e.download, r = i, a = document.createElement("a"), l;
  function h(d, c) {
    var u = d.shift(), f = c[u];
    return d.length && typeof f == "object" ? h(d, f) : f;
  }
  if (e.labelField && (l = o.getData(), r = h(e.labelField.split(this.table.options.nestedFieldSeparator), l)), e.label)
    switch (typeof e.label) {
      case "string":
        r = e.label;
        break;
      case "function":
        r = e.label(o);
        break;
    }
  if (r) {
    if (e.urlField && (l = o.getData(), i = K.retrieveNestedData(this.table.options.nestedFieldSeparator, e.urlField, l)), e.url)
      switch (typeof e.url) {
        case "string":
          i = e.url;
          break;
        case "function":
          i = e.url(o);
          break;
      }
    return a.setAttribute("href", s + i), e.target && a.setAttribute("target", e.target), e.download && (typeof n == "function" ? n = n(o) : n = n === !0 ? "" : n, a.setAttribute("download", n)), a.innerHTML = this.emptyToSpace(this.sanitizeHTML(r)), a;
  } else
    return "&nbsp;";
}
function Sn(o, e, t) {
  var i = document.createElement("img"), s = o.getValue();
  switch (e.urlPrefix && (s = e.urlPrefix + o.getValue()), e.urlSuffix && (s = s + e.urlSuffix), i.setAttribute("src", s), typeof e.height) {
    case "number":
      i.style.height = e.height + "px";
      break;
    case "string":
      i.style.height = e.height;
      break;
  }
  switch (typeof e.width) {
    case "number":
      i.style.width = e.width + "px";
      break;
    case "string":
      i.style.width = e.width;
      break;
  }
  return i.addEventListener("load", function() {
    o.getRow().normalizeHeight();
  }), i;
}
function Dn(o, e, t) {
  var i = o.getValue(), s = o.getElement(), n = e.allowEmpty, r = e.allowTruthy, a = Object.keys(e).includes("trueValue"), l = typeof e.tickElement < "u" ? e.tickElement : '<svg enable-background="new 0 0 24 24" height="14" width="14" viewBox="0 0 24 24" xml:space="preserve" ><path class="tabulator-tick" clip-rule="evenodd" d="M21.652,3.211c-0.293-0.295-0.77-0.295-1.061,0L9.41,14.34  c-0.293,0.297-0.771,0.297-1.062,0L3.449,9.351C3.304,9.203,3.114,9.13,2.923,9.129C2.73,9.128,2.534,9.201,2.387,9.351  l-2.165,1.946C0.078,11.445,0,11.63,0,11.823c0,0.194,0.078,0.397,0.223,0.544l4.94,5.184c0.292,0.296,0.771,0.776,1.062,1.07  l2.124,2.141c0.292,0.293,0.769,0.293,1.062,0l14.366-14.34c0.293-0.294,0.293-0.777,0-1.071L21.652,3.211z" fill-rule="evenodd"/></svg>', h = typeof e.crossElement < "u" ? e.crossElement : '<svg enable-background="new 0 0 24 24" height="14" width="14"  viewBox="0 0 24 24" xml:space="preserve" ><path class="tabulator-cross" d="M22.245,4.015c0.313,0.313,0.313,0.826,0,1.139l-6.276,6.27c-0.313,0.312-0.313,0.826,0,1.14l6.273,6.272  c0.313,0.313,0.313,0.826,0,1.14l-2.285,2.277c-0.314,0.312-0.828,0.312-1.142,0l-6.271-6.271c-0.313-0.313-0.828-0.313-1.141,0  l-6.276,6.267c-0.313,0.313-0.828,0.313-1.141,0l-2.282-2.28c-0.313-0.313-0.313-0.826,0-1.14l6.278-6.269  c0.313-0.312,0.313-0.826,0-1.14L1.709,5.147c-0.314-0.313-0.314-0.827,0-1.14l2.284-2.278C4.308,1.417,4.821,1.417,5.135,1.73  L11.405,8c0.314,0.314,0.828,0.314,1.141,0.001l6.276-6.267c0.312-0.312,0.826-0.312,1.141,0L22.245,4.015z"/></svg>';
  return a && i === e.trueValue || !a && (r && i || i === !0 || i === "true" || i === "True" || i === 1 || i === "1") ? (s.setAttribute("aria-checked", !0), l || "") : n && (i === "null" || i === "" || i === null || typeof i > "u") ? (s.setAttribute("aria-checked", "mixed"), "") : (s.setAttribute("aria-checked", !1), h || "");
}
function zn(o, e, t) {
  var i = this.table.dependencyRegistry.lookup(["luxon", "DateTime"], "DateTime"), s = e.inputFormat || "yyyy-MM-dd HH:mm:ss", n = e.outputFormat || "dd/MM/yyyy HH:mm:ss", r = typeof e.invalidPlaceholder < "u" ? e.invalidPlaceholder : "", a = o.getValue();
  if (typeof i < "u") {
    var l;
    return i.isDateTime(a) ? l = a : s === "x" ? l = i.fromMillis(a) : s === "iso" ? l = i.fromISO(String(a)) : l = i.fromFormat(String(a), s), l.isValid ? (e.timezone && (l = l.setZone(e.timezone)), l.toFormat(n)) : r === !0 || !a ? a : typeof r == "function" ? r(a) : r;
  } else
    console.error("Format Error - 'datetime' formatter is dependant on luxon.js");
}
function Fn(o, e, t) {
  var i = this.table.dependencyRegistry.lookup(["luxon", "DateTime"], "DateTime"), s = e.inputFormat || "yyyy-MM-dd HH:mm:ss", n = typeof e.invalidPlaceholder < "u" ? e.invalidPlaceholder : "", r = typeof e.suffix < "u" ? e.suffix : !1, a = typeof e.unit < "u" ? e.unit : "days", l = typeof e.humanize < "u" ? e.humanize : !1, h = typeof e.date < "u" ? e.date : i.now(), d = o.getValue();
  if (typeof i < "u") {
    var c;
    return i.isDateTime(d) ? c = d : s === "x" ? c = i.fromMillis(d) : s === "iso" ? c = i.fromISO(String(d)) : c = i.fromFormat(String(d), s), c.isValid ? l ? c.diff(h, a).toHuman() + (r ? " " + r : "") : parseInt(c.diff(h, a)[a]) + (r ? " " + r : "") : n === !0 ? d : typeof n == "function" ? n(d) : n;
  } else
    console.error("Format Error - 'datetimediff' formatter is dependant on luxon.js");
}
function Hn(o, e, t) {
  var i = o.getValue();
  return typeof e[i] > "u" ? (console.warn("Missing display value for " + i), i) : e[i];
}
function An(o, e, t) {
  var i = o.getValue(), s = o.getElement(), n = e && e.stars ? e.stars : 5, r = document.createElement("span"), a = document.createElementNS("http://www.w3.org/2000/svg", "svg"), l = '<polygon fill="#FFEA00" stroke="#C1AB60" stroke-width="37.6152" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" points="259.216,29.942 330.27,173.919 489.16,197.007 374.185,309.08 401.33,467.31 259.216,392.612 117.104,467.31 144.25,309.08 29.274,197.007 188.165,173.919 "/>', h = '<polygon fill="#D2D2D2" stroke="#686868" stroke-width="37.6152" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" points="259.216,29.942 330.27,173.919 489.16,197.007 374.185,309.08 401.33,467.31 259.216,392.612 117.104,467.31 144.25,309.08 29.274,197.007 188.165,173.919 "/>';
  r.style.verticalAlign = "middle", a.setAttribute("width", "14"), a.setAttribute("height", "14"), a.setAttribute("viewBox", "0 0 512 512"), a.setAttribute("xml:space", "preserve"), a.style.padding = "0 1px", i = i && !Number.isNaN(i) ? parseInt(i) : 0, i = Math.max(0, Math.min(i, n));
  for (var d = 1; d <= n; d++) {
    var c = a.cloneNode(!0);
    c.innerHTML = d <= i ? l : h, r.appendChild(c);
  }
  return s.style.whiteSpace = "nowrap", s.style.overflow = "hidden", s.style.textOverflow = "ellipsis", s.setAttribute("aria-label", i), r;
}
function On(o, e, t) {
  var i = this.sanitizeHTML(o.getValue()) || 0, s = document.createElement("span"), n = e && e.max ? e.max : 100, r = e && e.min ? e.min : 0, a = e && typeof e.color < "u" ? e.color : ["red", "orange", "green"], l = "#666666", h, d;
  if (!(Number.isNaN(i) || typeof o.getValue() > "u")) {
    switch (s.classList.add("tabulator-traffic-light"), d = parseFloat(i) <= n ? parseFloat(i) : n, d = parseFloat(d) >= r ? parseFloat(d) : r, h = (n - r) / 100, d = Math.round((d - r) / h), typeof a) {
      case "string":
        l = a;
        break;
      case "function":
        l = a(i);
        break;
      case "object":
        if (Array.isArray(a)) {
          var c = 100 / a.length, u = Math.floor(d / c);
          u = Math.min(u, a.length - 1), u = Math.max(u, 0), l = a[u];
          break;
        }
    }
    return s.style.backgroundColor = l, s;
  }
}
function Pn(o, e = {}, t) {
  var i = this.sanitizeHTML(o.getValue()) || 0, s = o.getElement(), n = e.max ? e.max : 100, r = e.min ? e.min : 0, a = e.legendAlign ? e.legendAlign : "center", l, h, d, c, u;
  switch (h = parseFloat(i) <= n ? parseFloat(i) : n, h = parseFloat(h) >= r ? parseFloat(h) : r, l = (n - r) / 100, h = Math.round((h - r) / l), typeof e.color) {
    case "string":
      d = e.color;
      break;
    case "function":
      d = e.color(i);
      break;
    case "object":
      if (Array.isArray(e.color)) {
        let v = 100 / e.color.length, b = Math.floor(h / v);
        b = Math.min(b, e.color.length - 1), b = Math.max(b, 0), d = e.color[b];
        break;
      }
    default:
      d = "#2DC214";
  }
  switch (typeof e.legend) {
    case "string":
      c = e.legend;
      break;
    case "function":
      c = e.legend(i);
      break;
    case "boolean":
      c = i;
      break;
    default:
      c = !1;
  }
  switch (typeof e.legendColor) {
    case "string":
      u = e.legendColor;
      break;
    case "function":
      u = e.legendColor(i);
      break;
    case "object":
      if (Array.isArray(e.legendColor)) {
        let v = 100 / e.legendColor.length, b = Math.floor(h / v);
        b = Math.min(b, e.legendColor.length - 1), b = Math.max(b, 0), u = e.legendColor[b];
      }
      break;
    default:
      u = "#000";
  }
  s.style.minWidth = "30px", s.style.position = "relative", s.setAttribute("aria-label", h);
  var f = document.createElement("div");
  f.style.display = "inline-block", f.style.width = h + "%", f.style.backgroundColor = d, f.style.height = "100%", f.setAttribute("data-max", n), f.setAttribute("data-min", r);
  var m = document.createElement("div");
  if (m.style.position = "relative", m.style.width = "100%", m.style.height = "100%", c) {
    var p = document.createElement("div");
    p.style.position = "absolute", p.style.top = 0, p.style.left = 0, p.style.textAlign = a, p.style.width = "100%", p.style.color = u, p.innerHTML = c;
  }
  return t(function() {
    if (!(o instanceof $i)) {
      var v = document.createElement("div");
      v.style.position = "absolute", v.style.top = "4px", v.style.bottom = "4px", v.style.left = "4px", v.style.right = "4px", s.appendChild(v), s = v;
    }
    s.appendChild(m), m.appendChild(f), c && m.appendChild(p);
  }), "";
}
function _n(o, e, t) {
  return o.getElement().style.backgroundColor = this.sanitizeHTML(o.getValue()), "";
}
function Nn(o, e, t) {
  return '<svg enable-background="new 0 0 24 24" height="14" width="14" viewBox="0 0 24 24" xml:space="preserve" ><path fill="#2DC214" clip-rule="evenodd" d="M21.652,3.211c-0.293-0.295-0.77-0.295-1.061,0L9.41,14.34  c-0.293,0.297-0.771,0.297-1.062,0L3.449,9.351C3.304,9.203,3.114,9.13,2.923,9.129C2.73,9.128,2.534,9.201,2.387,9.351  l-2.165,1.946C0.078,11.445,0,11.63,0,11.823c0,0.194,0.078,0.397,0.223,0.544l4.94,5.184c0.292,0.296,0.771,0.776,1.062,1.07  l2.124,2.141c0.292,0.293,0.769,0.293,1.062,0l14.366-14.34c0.293-0.294,0.293-0.777,0-1.071L21.652,3.211z" fill-rule="evenodd"/></svg>';
}
function Bn(o, e, t) {
  return '<svg enable-background="new 0 0 24 24" height="14" width="14" viewBox="0 0 24 24" xml:space="preserve" ><path fill="#CE1515" d="M22.245,4.015c0.313,0.313,0.313,0.826,0,1.139l-6.276,6.27c-0.313,0.312-0.313,0.826,0,1.14l6.273,6.272  c0.313,0.313,0.313,0.826,0,1.14l-2.285,2.277c-0.314,0.312-0.828,0.312-1.142,0l-6.271-6.271c-0.313-0.313-0.828-0.313-1.141,0  l-6.276,6.267c-0.313,0.313-0.828,0.313-1.141,0l-2.282-2.28c-0.313-0.313-0.313-0.826,0-1.14l6.278-6.269  c0.313-0.312,0.313-0.826,0-1.14L1.709,5.147c-0.314-0.313-0.314-0.827,0-1.14l2.284-2.278C4.308,1.417,4.821,1.417,5.135,1.73  L11.405,8c0.314,0.314,0.828,0.314,1.141,0.001l6.276-6.267c0.312-0.312,0.826-0.312,1.141,0L22.245,4.015z"/></svg>';
}
function In(o, e, t) {
  var i = o.getValue(), s = e.size || 15, n = s + "px", r, a, l = e.hasOwnProperty("onValue") ? e.onValue : !0, h = e.hasOwnProperty("offValue") ? e.offValue : !1, d = e.onTruthy ? i : i === l;
  return r = document.createElement("div"), r.classList.add("tabulator-toggle"), d ? (r.classList.add("tabulator-toggle-on"), r.style.flexDirection = "row-reverse", e.onColor && (r.style.background = e.onColor)) : e.offColor && (r.style.background = e.offColor), r.style.width = 2.5 * s + "px", r.style.borderRadius = n, e.clickable && r.addEventListener("click", (c) => {
    o.setValue(d ? h : l);
  }), a = document.createElement("div"), a.classList.add("tabulator-toggle-switch"), a.style.height = n, a.style.width = n, a.style.borderRadius = n, r.appendChild(a), r;
}
function Vn(o, e, t) {
  var i = document.createElement("span"), s = o.getRow(), n = o.getTable();
  return s.watchPosition((r) => {
    e.relativeToPage && (r += n.modules.page.getPageSize() * (n.modules.page.getPage() - 1)), i.innerText = r;
  }), i;
}
function Wn(o, e, t) {
  return o.getElement().classList.add("tabulator-row-handle"), "<div class='tabulator-row-handle-box'><div class='tabulator-row-handle-bar'></div><div class='tabulator-row-handle-bar'></div><div class='tabulator-row-handle-bar'></div></div>";
}
function jn(o, e, t) {
  var i, s, n;
  function r(a) {
    var l = a.getValue(), h = "plaintext";
    switch (typeof l) {
      case "boolean":
        h = "tickCross";
        break;
      case "string":
        l.includes(`
`) && (h = "textarea");
        break;
    }
    return h;
  }
  return i = e.formatterLookup ? e.formatterLookup(o) : r(o), e.paramsLookup && (n = typeof e.paramsLookup == "function" ? e.paramsLookup(i, o) : e.paramsLookup[i]), s = this.table.modules.format.lookupFormatter(i), s.call(this, o, n || {}, t);
}
function Gn(o, e, t) {
  var i = e.delimiter || ",", s = o.getValue(), n = this.table, r;
  return e.valueMap && (typeof e.valueMap == "string" ? r = function(a) {
    return a.map((l) => K.retrieveNestedData(n.options.nestedFieldSeparator, e.valueMap, l));
  } : r = e.valueMap), Array.isArray(s) ? (r && (s = r(s)), s.join(i)) : s;
}
function Un(o, e, t) {
  var i = e.indent || "	", s = typeof e.multiline > "u" ? !0 : e.multiline, n = e.replacer || null, r = o.getValue();
  return s && (o.getElement().style.whiteSpace = "pre-wrap"), JSON.stringify(r, n, i);
}
var $n = {
  plaintext: xn,
  html: kn,
  textarea: Tn,
  money: Mn,
  link: Ln,
  image: Sn,
  tickCross: Dn,
  datetime: zn,
  datetimediff: Fn,
  lookup: Hn,
  star: An,
  traffic: On,
  progress: Pn,
  color: _n,
  buttonTick: Nn,
  buttonCross: Bn,
  toggle: In,
  rownum: Vn,
  handle: Wn,
  adaptable: jn,
  array: Gn,
  json: Un
};
const Fe = class Fe extends B {
  constructor(e) {
    super(e), this.registerColumnOption("formatter"), this.registerColumnOption("formatterParams"), this.registerColumnOption("formatterPrint"), this.registerColumnOption("formatterPrintParams"), this.registerColumnOption("formatterClipboard"), this.registerColumnOption("formatterClipboardParams"), this.registerColumnOption("formatterHtmlOutput"), this.registerColumnOption("formatterHtmlOutputParams"), this.registerColumnOption("titleFormatter"), this.registerColumnOption("titleFormatterParams");
  }
  initialize() {
    this.subscribe("cell-format", this.formatValue.bind(this)), this.subscribe("cell-rendered", this.cellRendered.bind(this)), this.subscribe("column-layout", this.initializeColumn.bind(this)), this.subscribe("column-format", this.formatHeader.bind(this));
  }
  //initialize column formatter
  initializeColumn(e) {
    e.modules.format = this.lookupTypeFormatter(e, ""), typeof e.definition.formatterPrint < "u" && (e.modules.format.print = this.lookupTypeFormatter(e, "Print")), typeof e.definition.formatterClipboard < "u" && (e.modules.format.clipboard = this.lookupTypeFormatter(e, "Clipboard")), typeof e.definition.formatterHtmlOutput < "u" && (e.modules.format.htmlOutput = this.lookupTypeFormatter(e, "HtmlOutput"));
  }
  lookupTypeFormatter(e, t) {
    var i = { params: e.definition["formatter" + t + "Params"] || {} }, s = e.definition["formatter" + t];
    return i.formatter = this.lookupFormatter(s), i;
  }
  lookupFormatter(e) {
    var t;
    switch (typeof e) {
      case "string":
        Fe.formatters[e] ? t = Fe.formatters[e] : (console.warn("Formatter Error - No such formatter found: ", e), t = Fe.formatters.plaintext);
        break;
      case "function":
        t = e;
        break;
      default:
        t = Fe.formatters.plaintext;
        break;
    }
    return t;
  }
  cellRendered(e) {
    e.modules.format && e.modules.format.renderedCallback && !e.modules.format.rendered && (e.modules.format.renderedCallback(), e.modules.format.rendered = !0);
  }
  //return a formatted value for a column header
  formatHeader(e, t, i) {
    var s, n, r, a;
    return e.definition.titleFormatter ? (s = this.lookupFormatter(e.definition.titleFormatter), r = (l) => {
      e.titleFormatterRendered = l;
    }, a = {
      getValue: function() {
        return t;
      },
      getElement: function() {
        return i;
      },
      getType: function() {
        return "header";
      },
      getColumn: function() {
        return e.getComponent();
      },
      getTable: () => this.table
    }, n = e.definition.titleFormatterParams || {}, n = typeof n == "function" ? n() : n, s.call(this, a, n, r)) : t;
  }
  //return a formatted value for a cell
  formatValue(e) {
    var t = e.getComponent(), i = typeof e.column.modules.format.params == "function" ? e.column.modules.format.params(t) : e.column.modules.format.params;
    function s(n) {
      e.modules.format || (e.modules.format = {}), e.modules.format.renderedCallback = n, e.modules.format.rendered = !1;
    }
    return e.column.modules.format.formatter.call(this, t, i, s);
  }
  formatExportValue(e, t) {
    var i = e.column.modules.format[t], s;
    if (i) {
      let r = function(a) {
        e.modules.format || (e.modules.format = {}), e.modules.format.renderedCallback = a, e.modules.format.rendered = !1;
      };
      var n = r;
      return s = typeof i.params == "function" ? i.params(e.getComponent()) : i.params, i.formatter.call(this, e.getComponent(), s, r);
    } else
      return this.formatValue(e);
  }
  sanitizeHTML(e) {
    if (e) {
      var t = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
        "/": "&#x2F;",
        "`": "&#x60;",
        "=": "&#x3D;"
      };
      return String(e).replace(/[&<>"'`=/]/g, function(i) {
        return t[i];
      });
    } else
      return e;
  }
  emptyToSpace(e) {
    return e === null || typeof e > "u" || e === "" ? "&nbsp;" : e;
  }
};
R(Fe, "moduleName", "format"), //load defaults
R(Fe, "formatters", $n);
let ti = Fe;
class Xi extends B {
  constructor(e) {
    super(e), this.leftColumns = [], this.rightColumns = [], this.initializationMode = "left", this.active = !1, this.blocked = !0, this.registerColumnOption("frozen");
  }
  //reset initial state
  reset() {
    this.initializationMode = "left", this.leftColumns = [], this.rightColumns = [], this.active = !1;
  }
  initialize() {
    this.subscribe("cell-layout", this.layoutCell.bind(this)), this.subscribe("column-init", this.initializeColumn.bind(this)), this.subscribe("column-width", this.layout.bind(this)), this.subscribe("row-layout-after", this.layoutRow.bind(this)), this.subscribe("table-layout", this.layout.bind(this)), this.subscribe("columns-loading", this.reset.bind(this)), this.subscribe("column-add", this.reinitializeColumns.bind(this)), this.subscribe("column-deleted", this.reinitializeColumns.bind(this)), this.subscribe("column-hide", this.reinitializeColumns.bind(this)), this.subscribe("column-show", this.reinitializeColumns.bind(this)), this.subscribe("columns-loaded", this.reinitializeColumns.bind(this)), this.subscribe("table-redraw", this.layout.bind(this)), this.subscribe("layout-refreshing", this.blockLayout.bind(this)), this.subscribe("layout-refreshed", this.unblockLayout.bind(this)), this.subscribe("scrollbar-vertical", this.adjustForScrollbar.bind(this));
  }
  blockLayout() {
    this.blocked = !0;
  }
  unblockLayout() {
    this.blocked = !1;
  }
  layoutCell(e) {
    this.layoutElement(e.element, e.column);
  }
  reinitializeColumns() {
    this.reset(), this.table.columnManager.columnsByIndex.forEach((e) => {
      this.initializeColumn(e);
    }), this.layout();
  }
  //initialize specific column
  initializeColumn(e) {
    var t = { margin: 0, edge: !1 };
    e.isGroup || (this.frozenCheck(e) ? (t.position = this.initializationMode, this.initializationMode == "left" ? this.leftColumns.push(e) : this.rightColumns.unshift(e), this.active = !0, e.modules.frozen = t) : this.initializationMode = "right");
  }
  frozenCheck(e) {
    return e.parent.isGroup && e.definition.frozen && console.warn("Frozen Column Error - Parent column group must be frozen, not individual columns or sub column groups"), e.parent.isGroup ? this.frozenCheck(e.parent) : e.definition.frozen;
  }
  //layout calculation rows
  layoutCalcRows() {
    this.table.modExists("columnCalcs") && (this.table.modules.columnCalcs.topInitialized && this.table.modules.columnCalcs.topRow && this.layoutRow(this.table.modules.columnCalcs.topRow), this.table.modules.columnCalcs.botInitialized && this.table.modules.columnCalcs.botRow && this.layoutRow(this.table.modules.columnCalcs.botRow), this.table.modExists("groupRows") && this.layoutGroupCalcs(this.table.modules.groupRows.getGroups()));
  }
  layoutGroupCalcs(e) {
    e.forEach((t) => {
      t.calcs.top && this.layoutRow(t.calcs.top), t.calcs.bottom && this.layoutRow(t.calcs.bottom), t.groupList && t.groupList.length && this.layoutGroupCalcs(t.groupList);
    });
  }
  //calculate column positions and layout headers
  layoutColumnPosition(e) {
    var t = [], i = 0, s = 0;
    this.leftColumns.forEach((n, r) => {
      if (n.modules.frozen.marginValue = i, n.modules.frozen.margin = n.modules.frozen.marginValue + "px", n.visible && (i += n.getWidth()), r == this.leftColumns.length - 1 ? n.modules.frozen.edge = !0 : n.modules.frozen.edge = !1, n.parent.isGroup) {
        var a = this.getColGroupParentElement(n);
        t.includes(a) || (this.layoutElement(a, n), t.push(a)), a.classList.toggle("tabulator-frozen-left", n.modules.frozen.edge && n.modules.frozen.position === "left"), a.classList.toggle("tabulator-frozen-right", n.modules.frozen.edge && n.modules.frozen.position === "right");
      } else
        this.layoutElement(n.getElement(), n);
      e && n.cells.forEach((l) => {
        this.layoutElement(l.getElement(!0), n);
      });
    }), this.rightColumns.forEach((n, r) => {
      n.modules.frozen.marginValue = s, n.modules.frozen.margin = n.modules.frozen.marginValue + "px", n.visible && (s += n.getWidth()), r == this.rightColumns.length - 1 ? n.modules.frozen.edge = !0 : n.modules.frozen.edge = !1, n.parent.isGroup ? this.layoutElement(this.getColGroupParentElement(n), n) : this.layoutElement(n.getElement(), n), e && n.cells.forEach((a) => {
        this.layoutElement(a.getElement(!0), n);
      });
    });
  }
  getColGroupParentElement(e) {
    return e.parent.isGroup ? this.getColGroupParentElement(e.parent) : e.getElement();
  }
  //layout columns appropriately
  layout() {
    this.active && !this.blocked && (this.layoutColumnPosition(), this.reinitializeRows(), this.layoutCalcRows());
  }
  reinitializeRows() {
    var e = this.table.rowManager.getVisibleRows(!0), t = this.table.rowManager.getRows().filter((i) => !e.includes(i));
    t.forEach((i) => {
      i.deinitialize();
    }), e.forEach((i) => {
      i.type === "row" && this.layoutRow(i);
    });
  }
  layoutRow(e) {
    this.table.options.layout === "fitDataFill" && this.rightColumns.length && (this.table.rowManager.getTableElement().style.minWidth = "calc(100% - " + this.rightMargin + ")"), this.leftColumns.forEach((t) => {
      var i = e.getCell(t);
      i && this.layoutElement(i.getElement(!0), t);
    }), this.rightColumns.forEach((t) => {
      var i = e.getCell(t);
      i && this.layoutElement(i.getElement(!0), t);
    });
  }
  layoutElement(e, t) {
    var i;
    t.modules.frozen && e && (e.style.position = "sticky", this.table.rtl ? i = t.modules.frozen.position === "left" ? "right" : "left" : i = t.modules.frozen.position, e.style[i] = t.modules.frozen.margin, e.classList.add("tabulator-frozen"), e.classList.toggle("tabulator-frozen-left", t.modules.frozen.edge && t.modules.frozen.position === "left"), e.classList.toggle("tabulator-frozen-right", t.modules.frozen.edge && t.modules.frozen.position === "right"));
  }
  adjustForScrollbar(e) {
    this.rightColumns.length && (this.table.columnManager.getContentsElement().style.width = "calc(100% - " + e + "px)");
  }
  getFrozenColumns() {
    return this.leftColumns.concat(this.rightColumns);
  }
  _calcSpace(e, t) {
    var i = 0;
    for (let s = 0; s < t; s++)
      e[s].visible && (i += e[s].getWidth());
    return i;
  }
}
R(Xi, "moduleName", "frozenColumns");
class Yi extends B {
  constructor(e) {
    super(e), this.topElement = document.createElement("div"), this.rows = [], this.registerComponentFunction("row", "freeze", this.freezeRow.bind(this)), this.registerComponentFunction("row", "unfreeze", this.unfreezeRow.bind(this)), this.registerComponentFunction("row", "isFrozen", this.isRowFrozen.bind(this)), this.registerTableOption("frozenRowsField", "id"), this.registerTableOption("frozenRows", !1);
  }
  initialize() {
    var e = document.createDocumentFragment();
    this.rows = [], this.topElement.classList.add("tabulator-frozen-rows-holder"), e.appendChild(document.createElement("br")), e.appendChild(this.topElement), this.table.columnManager.getContentsElement().insertBefore(e, this.table.columnManager.headersElement.nextSibling), this.subscribe("row-deleting", this.detachRow.bind(this)), this.subscribe("rows-visible", this.visibleRows.bind(this)), this.registerDisplayHandler(this.getRows.bind(this), 10), this.table.options.frozenRows && (this.subscribe("data-processed", this.initializeRows.bind(this)), this.subscribe("row-added", this.initializeRow.bind(this)), this.subscribe("table-redrawing", this.resizeHolderWidth.bind(this)), this.subscribe("column-resized", this.resizeHolderWidth.bind(this)), this.subscribe("column-show", this.resizeHolderWidth.bind(this)), this.subscribe("column-hide", this.resizeHolderWidth.bind(this))), this.resizeHolderWidth();
  }
  resizeHolderWidth() {
    this.topElement.style.minWidth = this.table.columnManager.headersElement.offsetWidth + "px";
  }
  initializeRows() {
    this.table.rowManager.getRows().forEach((e) => {
      this.initializeRow(e);
    });
  }
  initializeRow(e) {
    var t = this.table.options.frozenRows, i = typeof t;
    i === "number" ? e.getPosition() && e.getPosition() + this.rows.length <= t && this.freezeRow(e) : i === "function" ? t.call(this.table, e.getComponent()) && this.freezeRow(e) : Array.isArray(t) && t.includes(e.data[this.options("frozenRowsField")]) && this.freezeRow(e);
  }
  isRowFrozen(e) {
    var t = this.rows.indexOf(e);
    return t > -1;
  }
  isFrozen() {
    return !!this.rows.length;
  }
  visibleRows(e, t) {
    return this.rows.forEach((i) => {
      t.push(i);
    }), t;
  }
  //filter frozen rows out of display data
  getRows(e) {
    var t = e.slice(0);
    return this.rows.forEach(function(i) {
      var s = t.indexOf(i);
      s > -1 && t.splice(s, 1);
    }), t;
  }
  freezeRow(e) {
    e.modules.frozen ? console.warn("Freeze Error - Row is already frozen") : (e.modules.frozen = !0, this.topElement.appendChild(e.getElement()), e.initialize(), e.normalizeHeight(), this.rows.push(e), this.refreshData(!1, "display"), this.table.rowManager.adjustTableSize(), this.styleRows());
  }
  unfreezeRow(e) {
    e.modules.frozen ? (e.modules.frozen = !1, this.detachRow(e), this.table.rowManager.adjustTableSize(), this.refreshData(!1, "display"), this.rows.length && this.styleRows()) : console.warn("Freeze Error - Row is already unfrozen");
  }
  detachRow(e) {
    var t = this.rows.indexOf(e);
    if (t > -1) {
      var i = e.getElement();
      i.parentNode && i.parentNode.removeChild(i), this.rows.splice(t, 1);
    }
  }
  styleRows(e) {
    this.rows.forEach((t, i) => {
      this.table.rowManager.styleRow(t, i);
    });
  }
}
R(Yi, "moduleName", "frozenRows");
class qn {
  constructor(e) {
    return this._group = e, this.type = "GroupComponent", new Proxy(this, {
      get: function(t, i, s) {
        return typeof t[i] < "u" ? t[i] : t._group.groupManager.table.componentFunctionBinder.handle("group", t._group, i);
      }
    });
  }
  getKey() {
    return this._group.key;
  }
  getField() {
    return this._group.field;
  }
  getElement() {
    return this._group.element;
  }
  getRows() {
    return this._group.getRows(!0);
  }
  getSubGroups() {
    return this._group.getSubGroups(!0);
  }
  getParentGroup() {
    return this._group.parent ? this._group.parent.getComponent() : !1;
  }
  isVisible() {
    return this._group.visible;
  }
  show() {
    this._group.show();
  }
  hide() {
    this._group.hide();
  }
  toggle() {
    this._group.toggleVisibility();
  }
  scrollTo(e, t) {
    return this._group.groupManager.table.rowManager.scrollToRow(this._group, e, t);
  }
  _getSelf() {
    return this._group;
  }
  getTable() {
    return this._group.groupManager.table;
  }
}
class Ke {
  constructor(e, t, i, s, n, r, a) {
    this.groupManager = e, this.parent = t, this.key = s, this.level = i, this.field = n, this.hasSubGroups = i < e.groupIDLookups.length - 1, this.addRow = this.hasSubGroups ? this._addRowToGroup : this._addRow, this.type = "group", this.old = a, this.rows = [], this.groups = [], this.groupList = [], this.generator = r, this.element = !1, this.elementContents = !1, this.height = 0, this.outerHeight = 0, this.initialized = !1, this.calcs = {}, this.initialized = !1, this.modules = {}, this.arrowElement = !1, this.visible = a ? a.visible : typeof e.startOpen[i] < "u" ? e.startOpen[i] : e.startOpen[0], this.component = null, this.createElements(), this.addBindings(), this.createValueGroups();
  }
  wipe(e) {
    e || (this.groupList.length ? this.groupList.forEach(function(t) {
      t.wipe();
    }) : this.rows.forEach((t) => {
      t.modules && delete t.modules.group;
    })), this.element = !1, this.arrowElement = !1, this.elementContents = !1;
  }
  createElements() {
    var e = document.createElement("div");
    e.classList.add("tabulator-arrow"), this.element = document.createElement("div"), this.element.classList.add("tabulator-row"), this.element.classList.add("tabulator-group"), this.element.classList.add("tabulator-group-level-" + this.level), this.element.setAttribute("role", "rowgroup"), this.arrowElement = document.createElement("div"), this.arrowElement.classList.add("tabulator-group-toggle"), this.arrowElement.appendChild(e), this.groupManager.table.options.movableRows !== !1 && this.groupManager.table.modExists("moveRow") && this.groupManager.table.modules.moveRow.initializeGroupHeader(this);
  }
  createValueGroups() {
    var e = this.level + 1;
    this.groupManager.allowedValues && this.groupManager.allowedValues[e] && this.groupManager.allowedValues[e].forEach((t) => {
      this._createGroup(t, e);
    });
  }
  addBindings() {
    var e;
    this.groupManager.table.options.groupToggleElement && (e = this.groupManager.table.options.groupToggleElement == "arrow" ? this.arrowElement : this.element, e.addEventListener("click", (t) => {
      this.groupManager.table.options.groupToggleElement === "arrow" && (t.stopPropagation(), t.stopImmediatePropagation()), setTimeout(() => {
        this.toggleVisibility();
      });
    }));
  }
  _createGroup(e, t) {
    var i = t + "_" + e, s = new Ke(this.groupManager, this, t, e, this.groupManager.groupIDLookups[t].field, this.groupManager.headerGenerator[t] || this.groupManager.headerGenerator[0], this.old ? this.old.groups[i] : !1);
    this.groups[i] = s, this.groupList.push(s);
  }
  _addRowToGroup(e) {
    var t = this.level + 1;
    if (this.hasSubGroups) {
      var i = this.groupManager.groupIDLookups[t].func(e.getData()), s = t + "_" + i;
      this.groupManager.allowedValues && this.groupManager.allowedValues[t] ? this.groups[s] && this.groups[s].addRow(e) : (this.groups[s] || this._createGroup(i, t), this.groups[s].addRow(e));
    }
  }
  _addRow(e) {
    this.rows.push(e), e.modules.group = this;
  }
  insertRow(e, t, i) {
    var s = this.conformRowData({});
    e.updateData(s);
    var n = this.rows.indexOf(t);
    n > -1 ? i ? this.rows.splice(n + 1, 0, e) : this.rows.splice(n, 0, e) : i ? this.rows.push(e) : this.rows.unshift(e), e.modules.group = this, this.groupManager.table.modExists("columnCalcs") && this.groupManager.table.options.columnCalcs != "table" && this.groupManager.table.modules.columnCalcs.recalcGroup(this), this.groupManager.updateGroupRows(!0);
  }
  scrollHeader(e) {
    this.arrowElement && (this.arrowElement.style.marginLeft = e, this.groupList.forEach(function(t) {
      t.scrollHeader(e);
    }));
  }
  getRowIndex(e) {
  }
  //update row data to match grouping constraints
  conformRowData(e) {
    return this.field ? e[this.field] = this.key : console.warn("Data Conforming Error - Cannot conform row data to match new group as groupBy is a function"), this.parent && (e = this.parent.conformRowData(e)), e;
  }
  removeRow(e) {
    var t = this.rows.indexOf(e), i = e.getElement();
    t > -1 && this.rows.splice(t, 1), !this.groupManager.table.options.groupValues && !this.rows.length ? (this.parent ? this.parent.removeGroup(this) : this.groupManager.removeGroup(this), this.groupManager.updateGroupRows(!0)) : (i.parentNode && i.parentNode.removeChild(i), this.groupManager.blockRedraw || (this.generateGroupHeaderContents(), this.groupManager.table.modExists("columnCalcs") && this.groupManager.table.options.columnCalcs != "table" && this.groupManager.table.modules.columnCalcs.recalcGroup(this)));
  }
  removeGroup(e) {
    var t = e.level + "_" + e.key, i;
    this.groups[t] && (delete this.groups[t], i = this.groupList.indexOf(e), i > -1 && this.groupList.splice(i, 1), this.groupList.length || (this.parent ? this.parent.removeGroup(this) : this.groupManager.removeGroup(this)));
  }
  getHeadersAndRows() {
    var e = [];
    return e.push(this), this._visSet(), this.calcs.top && (this.calcs.top.detachElement(), this.calcs.top.deleteCells()), this.calcs.bottom && (this.calcs.bottom.detachElement(), this.calcs.bottom.deleteCells()), this.visible ? this.groupList.length ? this.groupList.forEach(function(t) {
      e = e.concat(t.getHeadersAndRows());
    }) : (this.groupManager.table.options.columnCalcs != "table" && this.groupManager.table.modExists("columnCalcs") && this.groupManager.table.modules.columnCalcs.hasTopCalcs() && (this.calcs.top = this.groupManager.table.modules.columnCalcs.generateTopRow(this.rows), e.push(this.calcs.top)), e = e.concat(this.rows), this.groupManager.table.options.columnCalcs != "table" && this.groupManager.table.modExists("columnCalcs") && this.groupManager.table.modules.columnCalcs.hasBottomCalcs() && (this.calcs.bottom = this.groupManager.table.modules.columnCalcs.generateBottomRow(this.rows), e.push(this.calcs.bottom))) : !this.groupList.length && this.groupManager.table.options.columnCalcs != "table" && this.groupManager.table.modExists("columnCalcs") && (this.groupManager.table.modules.columnCalcs.hasTopCalcs() && this.groupManager.table.options.groupClosedShowCalcs && (this.calcs.top = this.groupManager.table.modules.columnCalcs.generateTopRow(this.rows), e.push(this.calcs.top)), this.groupManager.table.modules.columnCalcs.hasBottomCalcs() && this.groupManager.table.options.groupClosedShowCalcs && (this.calcs.bottom = this.groupManager.table.modules.columnCalcs.generateBottomRow(this.rows), e.push(this.calcs.bottom))), e;
  }
  getData(e, t) {
    var i = [];
    return this._visSet(), (!e || e && this.visible) && this.rows.forEach((s) => {
      i.push(s.getData(t || "data"));
    }), i;
  }
  getRowCount() {
    var e = 0;
    return this.groupList.length ? this.groupList.forEach((t) => {
      e += t.getRowCount();
    }) : e = this.rows.length, e;
  }
  toggleVisibility() {
    this.visible ? this.hide() : this.show();
  }
  hide() {
    this.visible = !1, this.groupManager.table.rowManager.getRenderMode() == "basic" && !this.groupManager.table.options.pagination ? (this.element.classList.remove("tabulator-group-visible"), this.groupList.length ? this.groupList.forEach((e) => {
      var t = e.getHeadersAndRows();
      t.forEach((i) => {
        i.detachElement();
      });
    }) : this.rows.forEach((e) => {
      var t = e.getElement();
      t.parentNode.removeChild(t);
    }), this.groupManager.updateGroupRows(!0)) : this.groupManager.updateGroupRows(!0), this.groupManager.table.externalEvents.dispatch("groupVisibilityChanged", this.getComponent(), !1);
  }
  show() {
    if (this.visible = !0, this.groupManager.table.rowManager.getRenderMode() == "basic" && !this.groupManager.table.options.pagination) {
      this.element.classList.add("tabulator-group-visible");
      var e = this.generateElement();
      this.groupList.length ? this.groupList.forEach((t) => {
        var i = t.getHeadersAndRows();
        i.forEach((s) => {
          var n = s.getElement();
          e.parentNode.insertBefore(n, e.nextSibling), s.initialize(), e = n;
        });
      }) : this.rows.forEach((t) => {
        var i = t.getElement();
        e.parentNode.insertBefore(i, e.nextSibling), t.initialize(), e = i;
      }), this.groupManager.updateGroupRows(!0);
    } else
      this.groupManager.updateGroupRows(!0);
    this.groupManager.table.externalEvents.dispatch("groupVisibilityChanged", this.getComponent(), !0);
  }
  _visSet() {
    var e = [];
    typeof this.visible == "function" && (this.rows.forEach(function(t) {
      e.push(t.getData());
    }), this.visible = this.visible(this.key, this.getRowCount(), e, this.getComponent()));
  }
  getRowGroup(e) {
    var t = !1;
    return this.groupList.length ? this.groupList.forEach(function(i) {
      var s = i.getRowGroup(e);
      s && (t = s);
    }) : this.rows.find(function(i) {
      return i === e;
    }) && (t = this), t;
  }
  getSubGroups(e) {
    var t = [];
    return this.groupList.forEach(function(i) {
      t.push(e ? i.getComponent() : i);
    }), t;
  }
  getRows(e, t) {
    var i = [];
    return t && this.groupList.length ? this.groupList.forEach((s) => {
      i = i.concat(s.getRows(e, t));
    }) : this.rows.forEach(function(s) {
      i.push(e ? s.getComponent() : s);
    }), i;
  }
  generateGroupHeaderContents() {
    var e = [], t = this.getRows(!1, !0);
    for (t.forEach(function(i) {
      e.push(i.getData());
    }), this.elementContents = this.generator(this.key, this.getRowCount(), e, this.getComponent()); this.element.firstChild; ) this.element.removeChild(this.element.firstChild);
    typeof this.elementContents == "string" ? this.element.innerHTML = this.elementContents : this.element.appendChild(this.elementContents), this.element.insertBefore(this.arrowElement, this.element.firstChild);
  }
  getPath(e = []) {
    return e.unshift(this.key), this.parent && this.parent.getPath(e), e;
  }
  ////////////// Standard Row Functions //////////////
  getElement() {
    return this.elementContents ? this.element : this.generateElement();
  }
  generateElement() {
    this.addBindings = !1, this._visSet(), this.visible ? this.element.classList.add("tabulator-group-visible") : this.element.classList.remove("tabulator-group-visible");
    for (var e = 0; e < this.element.childNodes.length; ++e)
      this.element.childNodes[e].parentNode.removeChild(this.element.childNodes[e]);
    return this.generateGroupHeaderContents(), this.element;
  }
  detachElement() {
    this.element && this.element.parentNode && this.element.parentNode.removeChild(this.element);
  }
  //normalize the height of elements in the row
  normalizeHeight() {
    this.setHeight(this.element.clientHeight);
  }
  initialize(e) {
    (!this.initialized || e) && (this.normalizeHeight(), this.initialized = !0);
  }
  reinitialize() {
    this.initialized = !1, this.height = 0, K.elVisible(this.element) && this.initialize(!0);
  }
  setHeight(e) {
    this.height != e && (this.height = e, this.outerHeight = this.element.offsetHeight);
  }
  //return rows outer height
  getHeight() {
    return this.outerHeight;
  }
  getGroup() {
    return this;
  }
  reinitializeHeight() {
  }
  calcHeight() {
    this.outerHeight = this.element.offsetHeight;
  }
  setCellHeight() {
  }
  clearCellHeight() {
  }
  deinitializeHeight() {
  }
  rendered() {
  }
  //////////////// Object Generation /////////////////
  getComponent() {
    return this.component || (this.component = new qn(this)), this.component;
  }
}
class Zi extends B {
  constructor(e) {
    super(e), this.groupIDLookups = !1, this.startOpen = [function() {
      return !1;
    }], this.headerGenerator = [function() {
      return "";
    }], this.groupList = [], this.allowedValues = !1, this.groups = {}, this.displayHandler = this.getRows.bind(this), this.blockRedraw = !1, this.registerTableOption("groupBy", !1), this.registerTableOption("groupStartOpen", !0), this.registerTableOption("groupValues", !1), this.registerTableOption("groupUpdateOnCellEdit", !1), this.registerTableOption("groupHeader", !1), this.registerTableOption("groupHeaderPrint", null), this.registerTableOption("groupHeaderClipboard", null), this.registerTableOption("groupHeaderHtmlOutput", null), this.registerTableOption("groupHeaderDownload", null), this.registerTableOption("groupToggleElement", "arrow"), this.registerTableOption("groupClosedShowCalcs", !1), this.registerTableFunction("setGroupBy", this.setGroupBy.bind(this)), this.registerTableFunction("setGroupValues", this.setGroupValues.bind(this)), this.registerTableFunction("setGroupStartOpen", this.setGroupStartOpen.bind(this)), this.registerTableFunction("setGroupHeader", this.setGroupHeader.bind(this)), this.registerTableFunction("getGroups", this.userGetGroups.bind(this)), this.registerTableFunction("getGroupedData", this.userGetGroupedData.bind(this)), this.registerComponentFunction("row", "getGroup", this.rowGetGroup.bind(this));
  }
  //initialize group configuration
  initialize() {
    this.subscribe("table-destroy", this._blockRedrawing.bind(this)), this.subscribe("rows-wipe", this._blockRedrawing.bind(this)), this.subscribe("rows-wiped", this._restore_redrawing.bind(this)), this.table.options.groupBy && (this.table.options.groupUpdateOnCellEdit && (this.subscribe("cell-value-updated", this.cellUpdated.bind(this)), this.subscribe("row-data-changed", this.reassignRowToGroup.bind(this), 0)), this.subscribe("table-built", this.configureGroupSetup.bind(this)), this.subscribe("row-deleting", this.rowDeleting.bind(this)), this.subscribe("row-deleted", this.rowsUpdated.bind(this)), this.subscribe("scroll-horizontal", this.scrollHeaders.bind(this)), this.subscribe("rows-wipe", this.wipe.bind(this)), this.subscribe("rows-added", this.rowsUpdated.bind(this)), this.subscribe("row-moving", this.rowMoving.bind(this)), this.subscribe("row-adding-index", this.rowAddingIndex.bind(this)), this.subscribe("rows-sample", this.rowSample.bind(this)), this.subscribe("render-virtual-fill", this.virtualRenderFill.bind(this)), this.subscribe("table-layout", this.virtualRenderFill.bind(this)), this.registerDisplayHandler(this.displayHandler, 20), this.initialized = !0);
  }
  _blockRedrawing() {
    this.blockRedraw = !0;
  }
  _restore_redrawing() {
    this.blockRedraw = !1;
  }
  configureGroupSetup() {
    if (this.table.options.groupBy) {
      var e = this.table.options.groupBy, t = this.table.options.groupStartOpen, i = this.table.options.groupHeader;
      if (this.allowedValues = this.table.options.groupValues, Array.isArray(e) && Array.isArray(i) && e.length > i.length && console.warn("Error creating group headers, groupHeader array is shorter than groupBy array"), this.headerGenerator = [function() {
        return "";
      }], this.startOpen = [function() {
        return !1;
      }], this.langBind("groups|item", (n, r) => {
        this.headerGenerator[0] = (a, l, h) => (typeof a > "u" ? "" : a) + "<span>(" + l + " " + (l === 1 ? n : r.groups.items) + ")</span>";
      }), this.groupIDLookups = [], e)
        this.table.modExists("columnCalcs") && this.table.options.columnCalcs != "table" && this.table.options.columnCalcs != "both" && this.table.modules.columnCalcs.removeCalcs();
      else if (this.table.modExists("columnCalcs") && this.table.options.columnCalcs != "group") {
        var s = this.table.columnManager.getRealColumns();
        s.forEach((n) => {
          n.definition.topCalc && this.table.modules.columnCalcs.initializeTopRow(), n.definition.bottomCalc && this.table.modules.columnCalcs.initializeBottomRow();
        });
      }
      Array.isArray(e) || (e = [e]), e.forEach((n, r) => {
        var a, l;
        typeof n == "function" ? a = n : (l = this.table.columnManager.getColumnByField(n), l ? a = function(h) {
          return l.getFieldValue(h);
        } : a = function(h) {
          return h[n];
        }), this.groupIDLookups.push({
          field: typeof n == "function" ? !1 : n,
          func: a,
          values: this.allowedValues ? this.allowedValues[r] : !1
        });
      }), t && (Array.isArray(t) || (t = [t]), t.forEach((n) => {
      }), this.startOpen = t), i && (this.headerGenerator = Array.isArray(i) ? i : [i]);
    } else
      this.groupList = [], this.groups = {};
  }
  rowSample(e, t) {
    if (this.table.options.groupBy) {
      var i = this.getGroups(!1)[0];
      t.push(i.getRows(!1)[0]);
    }
    return t;
  }
  virtualRenderFill() {
    const e = this.layoutMode();
    (e === "fitDataFill" || e === "fitDataStretch" || e === "fitColumns") && (this.table.rowManager.tableElement.style.minWidth = this.table.columnManager.getWidth() + "px");
  }
  rowAddingIndex(e, t, i) {
    if (this.table.options.groupBy) {
      this.assignRowToGroup(e);
      var s = e.modules.group.rows;
      return s.length > 1 && (!t || t && s.indexOf(t) == -1 ? i ? s[0] !== e && (t = s[0], this.table.rowManager.moveRowInArray(e.modules.group.rows, e, t, !i)) : s[s.length - 1] !== e && (t = s[s.length - 1], this.table.rowManager.moveRowInArray(e.modules.group.rows, e, t, !i)) : this.table.rowManager.moveRowInArray(e.modules.group.rows, e, t, !i)), t;
    }
  }
  trackChanges() {
    this.dispatch("group-changed");
  }
  ///////////////////////////////////
  ///////// Table Functions /////////
  ///////////////////////////////////
  setGroupBy(e) {
    this.table.options.groupBy = e, this.initialized || this.initialize(), this.configureGroupSetup(), !e && this.table.modExists("columnCalcs") && this.table.options.columnCalcs === !0 && this.table.modules.columnCalcs.reinitializeCalcs(), this.refreshData(), this.trackChanges();
  }
  setGroupValues(e) {
    this.table.options.groupValues = e, this.configureGroupSetup(), this.refreshData(), this.trackChanges();
  }
  setGroupStartOpen(e) {
    this.table.options.groupStartOpen = e, this.configureGroupSetup(), this.table.options.groupBy ? (this.refreshData(), this.trackChanges()) : console.warn("Grouping Update - cant refresh view, no groups have been set");
  }
  setGroupHeader(e) {
    this.table.options.groupHeader = e, this.configureGroupSetup(), this.table.options.groupBy ? (this.refreshData(), this.trackChanges()) : console.warn("Grouping Update - cant refresh view, no groups have been set");
  }
  userGetGroups(e) {
    return this.getGroups(!0);
  }
  // get grouped table data in the same format as getData()
  userGetGroupedData() {
    return this.table.options.groupBy ? this.getGroupedData() : this.getData();
  }
  ///////////////////////////////////////
  ///////// Component Functions /////////
  ///////////////////////////////////////
  rowGetGroup(e) {
    return e.modules.group ? e.modules.group.getComponent() : !1;
  }
  ///////////////////////////////////
  ///////// Internal Logic //////////
  ///////////////////////////////////
  rowMoving(e, t, i) {
    if (this.table.options.groupBy) {
      !i && t instanceof Ke && (t = this.table.rowManager.prevDisplayRow(e) || t);
      var s = t instanceof Ke ? t : t.modules.group, n = e instanceof Ke ? e : e.modules.group;
      s === n ? this.table.rowManager.moveRowInArray(s.rows, e, t, i) : (n && n.removeRow(e), s.insertRow(e, t, i));
    }
  }
  rowDeleting(e) {
    this.table.options.groupBy && e.modules.group && e.modules.group.removeRow(e);
  }
  rowsUpdated(e) {
    this.table.options.groupBy && this.updateGroupRows(!0);
  }
  cellUpdated(e) {
    this.table.options.groupBy && this.reassignRowToGroup(e.row);
  }
  //return appropriate rows with group headers
  getRows(e) {
    return this.table.options.groupBy && this.groupIDLookups.length ? (this.dispatchExternal("dataGrouping"), this.generateGroups(e), this.subscribedExternal("dataGrouped") && this.dispatchExternal("dataGrouped", this.getGroups(!0)), this.updateGroupRows()) : e.slice(0);
  }
  getGroups(e) {
    var t = [];
    return this.groupList.forEach(function(i) {
      t.push(e ? i.getComponent() : i);
    }), t;
  }
  getChildGroups(e) {
    var t = [];
    return e || (e = this), e.groupList.forEach((i) => {
      i.groupList.length ? t = t.concat(this.getChildGroups(i)) : t.push(i);
    }), t;
  }
  wipe() {
    this.table.options.groupBy && (this.groupList.forEach(function(e) {
      e.wipe();
    }), this.groupList = [], this.groups = {});
  }
  pullGroupListData(e) {
    var t = [];
    return e.forEach((i) => {
      var s = {};
      s.level = 0, s.rowCount = 0, s.headerContent = "";
      var n = [];
      i.hasSubGroups ? (n = this.pullGroupListData(i.groupList), s.level = i.level, s.rowCount = n.length - i.groupList.length, s.headerContent = i.generator(i.key, s.rowCount, i.rows, i), t.push(s), t = t.concat(n)) : (s.level = i.level, s.headerContent = i.generator(i.key, i.rows.length, i.rows, i), s.rowCount = i.getRows().length, t.push(s), i.getRows().forEach((r) => {
        t.push(r.getData("data"));
      }));
    }), t;
  }
  getGroupedData() {
    return this.pullGroupListData(this.groupList);
  }
  getRowGroup(e) {
    var t = !1;
    return this.options("dataTree") && (e = this.table.modules.dataTree.getTreeParentRoot(e)), this.groupList.forEach((i) => {
      var s = i.getRowGroup(e);
      s && (t = s);
    }), t;
  }
  countGroups() {
    return this.groupList.length;
  }
  generateGroups(e) {
    var t = this.groups;
    this.groups = {}, this.groupList = [], this.allowedValues && this.allowedValues[0] ? (this.allowedValues[0].forEach((i) => {
      this.createGroup(i, 0, t);
    }), e.forEach((i) => {
      this.assignRowToExistingGroup(i, t);
    })) : e.forEach((i) => {
      this.assignRowToGroup(i, t);
    }), Object.values(t).forEach((i) => {
      i.wipe(!0);
    });
  }
  createGroup(e, t, i) {
    var s = t + "_" + e, n;
    i = i || [], n = new Ke(this, !1, t, e, this.groupIDLookups[0].field, this.headerGenerator[0], i[s]), this.groups[s] = n, this.groupList.push(n);
  }
  assignRowToExistingGroup(e, t) {
    var i = this.groupIDLookups[0].func(e.getData()), s = "0_" + i;
    this.groups[s] && this.groups[s].addRow(e);
  }
  assignRowToGroup(e, t) {
    var i = this.groupIDLookups[0].func(e.getData()), s = !this.groups["0_" + i];
    return s && this.createGroup(i, 0, t), this.groups["0_" + i].addRow(e), !s;
  }
  reassignRowToGroup(e) {
    if (e.type === "row") {
      var t = e.modules.group, i = t.getPath(), s = this.getExpectedPath(e), n;
      n = i.length == s.length && i.every((r, a) => r === s[a]), n || (t.removeRow(e), this.assignRowToGroup(e, this.groups), this.refreshData(!0));
    }
  }
  getExpectedPath(e) {
    var t = [], i = e.getData();
    return this.groupIDLookups.forEach((s) => {
      t.push(s.func(i));
    }), t;
  }
  updateGroupRows(e) {
    var t = [];
    return this.blockRedraw || (this.groupList.forEach((i) => {
      t = t.concat(i.getHeadersAndRows());
    }), e && this.refreshData(!0)), t;
  }
  scrollHeaders(e) {
    this.table.options.groupBy && (this.table.options.renderHorizontal === "virtual" && (e -= this.table.columnManager.renderer.vDomPadLeft), e = e + "px", this.groupList.forEach((t) => {
      t.scrollHeader(e);
    }));
  }
  removeGroup(e) {
    var t = e.level + "_" + e.key, i;
    this.groups[t] && (delete this.groups[t], i = this.groupList.indexOf(e), i > -1 && this.groupList.splice(i, 1));
  }
  checkBasicModeGroupHeaderWidth() {
    var e = this.table.rowManager.tableElement, t = !0;
    this.table.rowManager.getDisplayRows().forEach((i, s) => {
      this.table.rowManager.styleRow(i, s), e.appendChild(i.getElement()), i.initialize(!0), i.type !== "group" && (t = !1);
    }), t ? e.style.minWidth = this.table.columnManager.getWidth() + "px" : e.style.minWidth = "";
  }
}
R(Zi, "moduleName", "groupRows");
var Kn = {
  cellEdit: function(o) {
    o.component.setValueProcessData(o.data.oldValue), o.component.cellRendered();
  },
  rowAdd: function(o) {
    o.component.deleteActual(), this.table.rowManager.checkPlaceholder();
  },
  rowDelete: function(o) {
    var e = this.table.rowManager.addRowActual(o.data.data, o.data.pos, o.data.index);
    this.table.options.groupBy && this.table.modExists("groupRows") && this.table.modules.groupRows.updateGroupRows(!0), this._rebindRow(o.component, e), this.table.rowManager.checkPlaceholder();
  },
  rowMove: function(o) {
    var e = o.data.posFrom - o.data.posTo > 0;
    this.table.rowManager.moveRowActual(o.component, this.table.rowManager.getRowFromPosition(o.data.posFrom), e), this.table.rowManager.regenerateRowPositions(), this.table.rowManager.reRenderInPosition();
  }
}, Jn = {
  cellEdit: function(o) {
    o.component.setValueProcessData(o.data.newValue), o.component.cellRendered();
  },
  rowAdd: function(o) {
    var e = this.table.rowManager.addRowActual(o.data.data, o.data.pos, o.data.index);
    this.table.options.groupBy && this.table.modExists("groupRows") && this.table.modules.groupRows.updateGroupRows(!0), this._rebindRow(o.component, e), this.table.rowManager.checkPlaceholder();
  },
  rowDelete: function(o) {
    o.component.deleteActual(), this.table.rowManager.checkPlaceholder();
  },
  rowMove: function(o) {
    this.table.rowManager.moveRowActual(o.component, this.table.rowManager.getRowFromPosition(o.data.posTo), o.data.after), this.table.rowManager.regenerateRowPositions(), this.table.rowManager.reRenderInPosition();
  }
}, Xn = {
  undo: ["ctrl + 90", "meta + 90"],
  redo: ["ctrl + 89", "meta + 89"]
}, Yn = {
  undo: function(o) {
    var e = !1;
    this.table.options.history && this.table.modExists("history") && this.table.modExists("edit") && (e = this.table.modules.edit.currentCell, e || (o.preventDefault(), this.table.modules.history.undo()));
  },
  redo: function(o) {
    var e = !1;
    this.table.options.history && this.table.modExists("history") && this.table.modExists("edit") && (e = this.table.modules.edit.currentCell, e || (o.preventDefault(), this.table.modules.history.redo()));
  }
}, Zn = {
  keybindings: {
    bindings: Xn,
    actions: Yn
  }
};
const He = class He extends B {
  constructor(e) {
    super(e), this.history = [], this.index = -1, this.registerTableOption("history", !1);
  }
  initialize() {
    this.table.options.history && (this.subscribe("cell-value-updated", this.cellUpdated.bind(this)), this.subscribe("cell-delete", this.clearComponentHistory.bind(this)), this.subscribe("row-delete", this.rowDeleted.bind(this)), this.subscribe("rows-wipe", this.clear.bind(this)), this.subscribe("row-added", this.rowAdded.bind(this)), this.subscribe("row-move", this.rowMoved.bind(this))), this.registerTableFunction("undo", this.undo.bind(this)), this.registerTableFunction("redo", this.redo.bind(this)), this.registerTableFunction("getHistoryUndoSize", this.getHistoryUndoSize.bind(this)), this.registerTableFunction("getHistoryRedoSize", this.getHistoryRedoSize.bind(this)), this.registerTableFunction("clearHistory", this.clear.bind(this));
  }
  rowMoved(e, t, i) {
    this.action("rowMove", e, { posFrom: e.getPosition(), posTo: t.getPosition(), to: t, after: i });
  }
  rowAdded(e, t, i, s) {
    this.action("rowAdd", e, { data: t, pos: i, index: s });
  }
  rowDeleted(e) {
    var t, i;
    this.table.options.groupBy ? (i = e.getComponent().getGroup()._getSelf().rows, t = i.indexOf(e), t && (t = i[t - 1])) : (t = e.table.rowManager.getRowIndex(e), t && (t = e.table.rowManager.rows[t - 1])), this.action("rowDelete", e, { data: e.getData(), pos: !t, index: t });
  }
  cellUpdated(e) {
    this.action("cellEdit", e, { oldValue: e.oldValue, newValue: e.value });
  }
  clear() {
    this.history = [], this.index = -1;
  }
  action(e, t, i) {
    this.history = this.history.slice(0, this.index + 1), this.history.push({
      type: e,
      component: t,
      data: i
    }), this.index++;
  }
  getHistoryUndoSize() {
    return this.index + 1;
  }
  getHistoryRedoSize() {
    return this.history.length - (this.index + 1);
  }
  clearComponentHistory(e) {
    var t = this.history.findIndex(function(i) {
      return i.component === e;
    });
    t > -1 && (this.history.splice(t, 1), t <= this.index && this.index--, this.clearComponentHistory(e));
  }
  undo() {
    if (this.index > -1) {
      let e = this.history[this.index];
      return He.undoers[e.type].call(this, e), this.index--, this.dispatchExternal("historyUndo", e.type, e.component.getComponent(), e.data), !0;
    } else
      return console.warn(this.options("history") ? "History Undo Error - No more history to undo" : "History module not enabled"), !1;
  }
  redo() {
    if (this.history.length - 1 > this.index) {
      this.index++;
      let e = this.history[this.index];
      return He.redoers[e.type].call(this, e), this.dispatchExternal("historyRedo", e.type, e.component.getComponent(), e.data), !0;
    } else
      return console.warn(this.options("history") ? "History Redo Error - No more history to redo" : "History module not enabled"), !1;
  }
  //rebind rows to new element after deletion
  _rebindRow(e, t) {
    this.history.forEach(function(i) {
      if (i.component instanceof te)
        i.component === e && (i.component = t);
      else if (i.component instanceof ft && i.component.row === e) {
        var s = i.component.column.getField();
        s && (i.component = t.getCell(s));
      }
    });
  }
};
R(He, "moduleName", "history"), R(He, "moduleExtensions", Zn), //load defaults
R(He, "undoers", Kn), R(He, "redoers", Jn);
let ii = He;
class Qi extends B {
  constructor(e) {
    super(e), this.fieldIndex = [], this.hasIndex = !1;
  }
  initialize() {
    this.tableElementCheck();
  }
  tableElementCheck() {
    this.table.originalElement && this.table.originalElement.tagName === "TABLE" && (this.table.originalElement.childNodes.length ? this.parseTable() : console.warn("Unable to parse data from empty table tag, Tabulator should be initialized on a div tag unless importing data from a table element."));
  }
  parseTable() {
    var e = this.table.originalElement, t = this.table.options, i = e.getElementsByTagName("th"), s = e.getElementsByTagName("tbody")[0], n = [];
    this.hasIndex = !1, this.dispatchExternal("htmlImporting"), s = s ? s.getElementsByTagName("tr") : [], this._extractOptions(e, t), i.length ? this._extractHeaders(i, s) : this._generateBlankHeaders(i, s);
    for (var r = 0; r < s.length; r++) {
      var a = s[r], l = a.getElementsByTagName("td"), h = {};
      this.hasIndex || (h[t.index] = r);
      for (var d = 0; d < l.length; d++) {
        var c = l[d];
        typeof this.fieldIndex[d] < "u" && (h[this.fieldIndex[d]] = c.innerHTML);
      }
      n.push(h);
    }
    t.data = n, this.dispatchExternal("htmlImported");
  }
  //extract tabulator attribute options
  _extractOptions(e, t, i) {
    var s = e.attributes, n = Object.keys(i || t), r = {};
    n.forEach((d) => {
      r[d.toLowerCase()] = d;
    });
    for (var a in s) {
      var l = s[a], h;
      l && typeof l == "object" && l.name && l.name.indexOf("tabulator-") === 0 && (h = l.name.replace("tabulator-", ""), typeof r[h] < "u" && (t[r[h]] = this._attribValue(l.value)));
    }
  }
  //get value of attribute
  _attribValue(e) {
    return e === "true" ? !0 : e === "false" ? !1 : e;
  }
  //find column if it has already been defined
  _findCol(e) {
    var t = this.table.options.columns.find((i) => i.title === e);
    return t || !1;
  }
  //extract column from headers
  _extractHeaders(e, t) {
    for (var i = 0; i < e.length; i++) {
      var s = e[i], n = !1, r = this._findCol(s.textContent), a;
      r ? n = !0 : r = { title: s.textContent.trim() }, r.field || (r.field = s.textContent.trim().toLowerCase().replaceAll(" ", "_")), a = s.getAttribute("width"), a && !r.width && (r.width = a), this._extractOptions(s, r, this.table.columnManager.optionsList.registeredDefaults), this.fieldIndex[i] = r.field, r.field == this.table.options.index && (this.hasIndex = !0), n || this.table.options.columns.push(r);
    }
  }
  //generate blank headers
  _generateBlankHeaders(e, t) {
    for (var i = 0; i < e.length; i++) {
      var s = e[i], n = { title: "", field: "col" + i };
      this.fieldIndex[i] = n.field;
      var r = s.getAttribute("width");
      r && (n.width = r), this.table.options.columns.push(n);
    }
  }
}
R(Qi, "moduleName", "htmlTableImport");
function Qn(o) {
  var e = [], t = 0, i = 0, s = !1;
  for (let n = 0; n < o.length; n++) {
    let r = o[n], a = o[n + 1];
    if (e[t] || (e[t] = []), e[t][i] || (e[t][i] = ""), r == '"' && s && a == '"') {
      e[t][i] += r, n++;
      continue;
    }
    if (r == '"') {
      s = !s;
      continue;
    }
    if (r == "," && !s) {
      i++;
      continue;
    }
    if (r == "\r" && a == `
` && !s) {
      i = 0, t++, n++;
      continue;
    }
    if ((r == "\r" || r == `
`) && !s) {
      i = 0, t++;
      continue;
    }
    e[t][i] += r;
  }
  return e;
}
function er(o) {
  try {
    return JSON.parse(o);
  } catch (e) {
    return console.warn("JSON Import Error - File contents is invalid JSON", e), Promise.reject();
  }
}
function tr(o) {
  return o;
}
function ir(o) {
  var e = this.dependencyRegistry.lookup("XLSX"), t = e.read(o), i = t.Sheets[t.SheetNames[0]];
  return e.utils.sheet_to_json(i, { header: 1 });
}
var sr = {
  csv: Qn,
  json: er,
  array: tr,
  xlsx: ir
};
const at = class at extends B {
  constructor(e) {
    super(e), this.registerTableOption("importFormat"), this.registerTableOption("importReader", "text"), this.registerTableOption("importHeaderTransform"), this.registerTableOption("importValueTransform"), this.registerTableOption("importDataValidator"), this.registerTableOption("importFileValidator");
  }
  initialize() {
    this.registerTableFunction("import", this.importFromFile.bind(this)), this.table.options.importFormat && (this.subscribe("data-loading", this.loadDataCheck.bind(this), 10), this.subscribe("data-load", this.loadData.bind(this), 10));
  }
  loadDataCheck(e) {
    return this.table.options.importFormat && (typeof e == "string" || Array.isArray(e) && e.length && Array.isArray(e));
  }
  loadData(e, t, i, s, n) {
    return this.importData(this.lookupImporter(), e).then(this.structureData.bind(this)).catch((r) => (console.error("Import Error:", r || "Unable to import data"), Promise.reject(r)));
  }
  lookupImporter(e) {
    var t;
    return e || (e = this.table.options.importFormat), typeof e == "string" ? t = at.importers[e] : t = e, t || console.error("Import Error - Importer not found:", e), t;
  }
  importFromFile(e, t, i) {
    var s = this.lookupImporter(e);
    if (s)
      return this.pickFile(t, i).then(this.importData.bind(this, s)).then(this.structureData.bind(this)).then(this.mutateData.bind(this)).then(this.validateData.bind(this)).then(this.setData.bind(this)).catch((n) => (this.dispatch("import-error", n), this.dispatchExternal("importError", n), console.error("Import Error:", n || "Unable to import file"), this.table.dataLoader.alertError(), setTimeout(() => {
        this.table.dataLoader.clearAlert();
      }, 3e3), Promise.reject(n)));
  }
  pickFile(e, t) {
    return new Promise((i, s) => {
      var n = document.createElement("input");
      n.type = "file", n.accept = e, n.addEventListener("change", (r) => {
        var a = n.files[0], l = new FileReader(), h = this.validateFile(a);
        if (h === !0) {
          switch (this.dispatch("import-importing", n.files), this.dispatchExternal("importImporting", n.files), t || this.table.options.importReader) {
            case "buffer":
              l.readAsArrayBuffer(a);
              break;
            case "binary":
              l.readAsBinaryString(a);
              break;
            case "url":
              l.readAsDataURL(a);
              break;
            case "text":
            default:
              l.readAsText(a);
          }
          l.onload = (d) => {
            i(l.result);
          }, l.onerror = (d) => {
            console.warn("File Load Error - Unable to read file"), s(d);
          };
        } else
          s(h);
      }), this.dispatch("import-choose"), this.dispatchExternal("importChoose"), n.click();
    });
  }
  importData(e, t) {
    var i;
    return this.table.dataLoader.alertLoader(), new Promise((s, n) => {
      setTimeout(() => {
        i = e.call(this.table, t), i instanceof Promise || i ? s(i) : n();
      }, 10);
    });
  }
  structureData(e) {
    var t = [];
    return Array.isArray(e) && e.length && Array.isArray(e[0]) ? (this.table.options.autoColumns ? t = this.structureArrayToObject(e) : t = this.structureArrayToColumns(e), t) : e;
  }
  mutateData(e) {
    var t = [];
    return Array.isArray(e) ? e.forEach((i) => {
      t.push(this.table.modules.mutator.transformRow(i, "import"));
    }) : t = e, t;
  }
  transformHeader(e) {
    var t = [];
    if (this.table.options.importHeaderTransform)
      e.forEach((i) => {
        t.push(this.table.options.importHeaderTransform.call(this.table, i, e));
      });
    else
      return e;
    return t;
  }
  transformData(e) {
    var t = [];
    if (this.table.options.importValueTransform)
      e.forEach((i) => {
        t.push(this.table.options.importValueTransform.call(this.table, i, e));
      });
    else
      return e;
    return t;
  }
  structureArrayToObject(e) {
    var t = this.transformHeader(e.shift()), i = e.map((s) => {
      var n = {};
      return s = this.transformData(s), t.forEach((r, a) => {
        n[r] = s[a];
      }), n;
    });
    return i;
  }
  structureArrayToColumns(e) {
    var t = [], i = this.transformHeader(e[0]), s = this.table.getColumns();
    return s[0] && i[0] && s[0].getDefinition().title === i[0] && e.shift(), e.forEach((n) => {
      var r = {};
      n = this.transformData(n), n.forEach((a, l) => {
        var h = s[l];
        h && (r[h.getField()] = a);
      }), t.push(r);
    }), t;
  }
  validateFile(e) {
    return this.table.options.importFileValidator ? this.table.options.importFileValidator.call(this.table, e) : !0;
  }
  validateData(e) {
    var t;
    return this.table.options.importDataValidator ? (t = this.table.options.importDataValidator.call(this.table, e), t === !0 ? e : Promise.reject(t)) : e;
  }
  setData(e) {
    return this.dispatch("import-imported", e), this.dispatchExternal("importImported", e), this.table.dataLoader.clearAlert(), this.table.setData(e);
  }
};
R(at, "moduleName", "import"), //load defaults
R(at, "importers", sr);
let si = at;
class es extends B {
  constructor(e) {
    super(e), this.eventMap = {
      //row events
      rowClick: "row-click",
      rowDblClick: "row-dblclick",
      rowContext: "row-contextmenu",
      rowMouseEnter: "row-mouseenter",
      rowMouseLeave: "row-mouseleave",
      rowMouseOver: "row-mouseover",
      rowMouseOut: "row-mouseout",
      rowMouseMove: "row-mousemove",
      rowMouseDown: "row-mousedown",
      rowMouseUp: "row-mouseup",
      rowTap: "row",
      rowDblTap: "row",
      rowTapHold: "row",
      //cell events
      cellClick: "cell-click",
      cellDblClick: "cell-dblclick",
      cellContext: "cell-contextmenu",
      cellMouseEnter: "cell-mouseenter",
      cellMouseLeave: "cell-mouseleave",
      cellMouseOver: "cell-mouseover",
      cellMouseOut: "cell-mouseout",
      cellMouseMove: "cell-mousemove",
      cellMouseDown: "cell-mousedown",
      cellMouseUp: "cell-mouseup",
      cellTap: "cell",
      cellDblTap: "cell",
      cellTapHold: "cell",
      //column header events
      headerClick: "column-click",
      headerDblClick: "column-dblclick",
      headerContext: "column-contextmenu",
      headerMouseEnter: "column-mouseenter",
      headerMouseLeave: "column-mouseleave",
      headerMouseOver: "column-mouseover",
      headerMouseOut: "column-mouseout",
      headerMouseMove: "column-mousemove",
      headerMouseDown: "column-mousedown",
      headerMouseUp: "column-mouseup",
      headerTap: "column",
      headerDblTap: "column",
      headerTapHold: "column",
      //group header
      groupClick: "group-click",
      groupDblClick: "group-dblclick",
      groupContext: "group-contextmenu",
      groupMouseEnter: "group-mouseenter",
      groupMouseLeave: "group-mouseleave",
      groupMouseOver: "group-mouseover",
      groupMouseOut: "group-mouseout",
      groupMouseMove: "group-mousemove",
      groupMouseDown: "group-mousedown",
      groupMouseUp: "group-mouseup",
      groupTap: "group",
      groupDblTap: "group",
      groupTapHold: "group"
    }, this.subscribers = {}, this.touchSubscribers = {}, this.columnSubscribers = {}, this.touchWatchers = {
      row: {
        tap: null,
        tapDbl: null,
        tapHold: null
      },
      cell: {
        tap: null,
        tapDbl: null,
        tapHold: null
      },
      column: {
        tap: null,
        tapDbl: null,
        tapHold: null
      },
      group: {
        tap: null,
        tapDbl: null,
        tapHold: null
      }
    }, this.registerColumnOption("headerClick"), this.registerColumnOption("headerDblClick"), this.registerColumnOption("headerContext"), this.registerColumnOption("headerMouseEnter"), this.registerColumnOption("headerMouseLeave"), this.registerColumnOption("headerMouseOver"), this.registerColumnOption("headerMouseOut"), this.registerColumnOption("headerMouseMove"), this.registerColumnOption("headerMouseDown"), this.registerColumnOption("headerMouseUp"), this.registerColumnOption("headerTap"), this.registerColumnOption("headerDblTap"), this.registerColumnOption("headerTapHold"), this.registerColumnOption("cellClick"), this.registerColumnOption("cellDblClick"), this.registerColumnOption("cellContext"), this.registerColumnOption("cellMouseEnter"), this.registerColumnOption("cellMouseLeave"), this.registerColumnOption("cellMouseOver"), this.registerColumnOption("cellMouseOut"), this.registerColumnOption("cellMouseMove"), this.registerColumnOption("cellMouseDown"), this.registerColumnOption("cellMouseUp"), this.registerColumnOption("cellTap"), this.registerColumnOption("cellDblTap"), this.registerColumnOption("cellTapHold");
  }
  initialize() {
    this.initializeExternalEvents(), this.subscribe("column-init", this.initializeColumn.bind(this)), this.subscribe("cell-dblclick", this.cellContentsSelectionFixer.bind(this)), this.subscribe("scroll-horizontal", this.clearTouchWatchers.bind(this)), this.subscribe("scroll-vertical", this.clearTouchWatchers.bind(this));
  }
  clearTouchWatchers() {
    var e = Object.values(this.touchWatchers);
    e.forEach((t) => {
      clearTimeout(t.tapDbl), clearTimeout(t.tapHold);
      for (let i in t)
        t[i] = null;
    });
  }
  cellContentsSelectionFixer(e, t) {
    var i;
    if (!(this.table.modExists("edit") && this.table.modules.edit.currentCell === t)) {
      e.preventDefault();
      try {
        document.selection ? (i = document.body.createTextRange(), i.moveToElementText(t.getElement()), i.select()) : window.getSelection && (i = document.createRange(), i.selectNode(t.getElement()), window.getSelection().removeAllRanges(), window.getSelection().addRange(i));
      } catch {
      }
    }
  }
  initializeExternalEvents() {
    for (let e in this.eventMap)
      this.subscriptionChangeExternal(e, this.subscriptionChanged.bind(this, e));
  }
  subscriptionChanged(e, t) {
    t ? this.subscribers[e] || (this.eventMap[e].includes("-") ? (this.subscribers[e] = this.handle.bind(this, e), this.subscribe(this.eventMap[e], this.subscribers[e])) : this.subscribeTouchEvents(e)) : this.eventMap[e].includes("-") ? this.subscribers[e] && !this.columnSubscribers[e] && !this.subscribedExternal(e) && (this.unsubscribe(this.eventMap[e], this.subscribers[e]), delete this.subscribers[e]) : this.unsubscribeTouchEvents(e);
  }
  subscribeTouchEvents(e) {
    var t = this.eventMap[e];
    this.touchSubscribers[t + "-touchstart"] || (this.touchSubscribers[t + "-touchstart"] = this.handleTouch.bind(this, t, "start"), this.touchSubscribers[t + "-touchend"] = this.handleTouch.bind(this, t, "end"), this.subscribe(t + "-touchstart", this.touchSubscribers[t + "-touchstart"]), this.subscribe(t + "-touchend", this.touchSubscribers[t + "-touchend"])), this.subscribers[e] = !0;
  }
  unsubscribeTouchEvents(e) {
    var t = !0, i = this.eventMap[e];
    if (this.subscribers[e] && !this.subscribedExternal(e)) {
      delete this.subscribers[e];
      for (let s in this.eventMap)
        this.eventMap[s] === i && this.subscribers[s] && (t = !1);
      t && (this.unsubscribe(i + "-touchstart", this.touchSubscribers[i + "-touchstart"]), this.unsubscribe(i + "-touchend", this.touchSubscribers[i + "-touchend"]), delete this.touchSubscribers[i + "-touchstart"], delete this.touchSubscribers[i + "-touchend"]);
    }
  }
  initializeColumn(e) {
    var t = e.definition;
    for (let i in this.eventMap)
      t[i] && (this.subscriptionChanged(i, !0), this.columnSubscribers[i] || (this.columnSubscribers[i] = []), this.columnSubscribers[i].push(e));
  }
  handle(e, t, i) {
    this.dispatchEvent(e, t, i);
  }
  handleTouch(e, t, i, s) {
    var n = this.touchWatchers[e];
    switch (e === "column" && (e = "header"), t) {
      case "start":
        n.tap = !0, clearTimeout(n.tapHold), n.tapHold = setTimeout(() => {
          clearTimeout(n.tapHold), n.tapHold = null, n.tap = null, clearTimeout(n.tapDbl), n.tapDbl = null, this.dispatchEvent(e + "TapHold", i, s);
        }, 1e3);
        break;
      case "end":
        n.tap && (n.tap = null, this.dispatchEvent(e + "Tap", i, s)), n.tapDbl ? (clearTimeout(n.tapDbl), n.tapDbl = null, this.dispatchEvent(e + "DblTap", i, s)) : n.tapDbl = setTimeout(() => {
          clearTimeout(n.tapDbl), n.tapDbl = null;
        }, 300), clearTimeout(n.tapHold), n.tapHold = null;
        break;
    }
  }
  dispatchEvent(e, t, i) {
    var s = i.getComponent(), n;
    this.columnSubscribers[e] && (i instanceof ft ? n = i.column.definition[e] : i instanceof je && (n = i.definition[e]), n && n(t, s)), this.dispatchExternal(e, t, s);
  }
}
R(es, "moduleName", "interaction");
var nr = {
  navPrev: "shift + 9",
  navNext: 9,
  navUp: 38,
  navDown: 40,
  navLeft: 37,
  navRight: 39,
  scrollPageUp: 33,
  scrollPageDown: 34,
  scrollToStart: 36,
  scrollToEnd: 35
}, rr = {
  keyBlock: function(o) {
    o.stopPropagation(), o.preventDefault();
  },
  scrollPageUp: function(o) {
    var e = this.table.rowManager, t = e.scrollTop - e.element.clientHeight;
    o.preventDefault(), e.displayRowsCount && (t >= 0 ? e.element.scrollTop = t : e.scrollToRow(e.getDisplayRows()[0])), this.table.element.focus();
  },
  scrollPageDown: function(o) {
    var e = this.table.rowManager, t = e.scrollTop + e.element.clientHeight, i = e.element.scrollHeight;
    o.preventDefault(), e.displayRowsCount && (t <= i ? e.element.scrollTop = t : e.scrollToRow(e.getDisplayRows()[e.displayRowsCount - 1])), this.table.element.focus();
  },
  scrollToStart: function(o) {
    var e = this.table.rowManager;
    o.preventDefault(), e.displayRowsCount && e.scrollToRow(e.getDisplayRows()[0]), this.table.element.focus();
  },
  scrollToEnd: function(o) {
    var e = this.table.rowManager;
    o.preventDefault(), e.displayRowsCount && e.scrollToRow(e.getDisplayRows()[e.displayRowsCount - 1]), this.table.element.focus();
  },
  navPrev: function(o) {
    this.dispatch("keybinding-nav-prev", o);
  },
  navNext: function(o) {
    this.dispatch("keybinding-nav-next", o);
  },
  navLeft: function(o) {
    this.dispatch("keybinding-nav-left", o);
  },
  navRight: function(o) {
    this.dispatch("keybinding-nav-right", o);
  },
  navUp: function(o) {
    this.dispatch("keybinding-nav-up", o);
  },
  navDown: function(o) {
    this.dispatch("keybinding-nav-down", o);
  }
};
const Ae = class Ae extends B {
  constructor(e) {
    super(e), this.watchKeys = null, this.pressedKeys = null, this.keyupBinding = !1, this.keydownBinding = !1, this.registerTableOption("keybindings", {}), this.registerTableOption("tabEndNewRow", !1);
  }
  initialize() {
    var e = this.table.options.keybindings, t = {};
    this.watchKeys = {}, this.pressedKeys = [], e !== !1 && (Object.assign(t, Ae.bindings), Object.assign(t, e), this.mapBindings(t), this.bindEvents()), this.subscribe("table-destroy", this.clearBindings.bind(this));
  }
  mapBindings(e) {
    for (let t in e)
      Ae.actions[t] ? e[t] && (typeof e[t] != "object" && (e[t] = [e[t]]), e[t].forEach((i) => {
        var s = Array.isArray(i) ? i : [i];
        s.forEach((n) => {
          this.mapBinding(t, n);
        });
      })) : console.warn("Key Binding Error - no such action:", t);
  }
  getKeyCode(e) {
    if (e.key.length === 1)
      return e.key.toUpperCase().charCodeAt(0);
    var t = {
      Enter: 13,
      Escape: 27,
      Tab: 9,
      Backspace: 8,
      Delete: 46,
      ArrowUp: 38,
      ArrowDown: 40,
      ArrowLeft: 37,
      ArrowRight: 39,
      Home: 36,
      End: 35,
      PageUp: 33,
      PageDown: 34,
      Insert: 45
    };
    return t[e.key] || e.keyCode || 0;
  }
  mapBinding(e, t) {
    var i = {
      action: Ae.actions[e],
      keys: [],
      ctrl: !1,
      shift: !1,
      meta: !1
    }, s = t.toString().toLowerCase().split(" ").join("").split("+");
    s.forEach((n) => {
      switch (n) {
        case "ctrl":
          i.ctrl = !0;
          break;
        case "shift":
          i.shift = !0;
          break;
        case "meta":
          i.meta = !0;
          break;
        default:
          n = isNaN(n) ? n.toUpperCase().charCodeAt(0) : parseInt(n), i.keys.push(n), this.watchKeys[n] || (this.watchKeys[n] = []), this.watchKeys[n].push(i);
      }
    });
  }
  bindEvents() {
    var e = this;
    this.keyupBinding = function(t) {
      var i = e.getKeyCode(t), s = e.watchKeys[i];
      s && (e.pressedKeys.push(i), s.forEach(function(n) {
        e.checkBinding(t, n);
      }));
    }, this.keydownBinding = function(t) {
      var i = e.getKeyCode(t), s = e.watchKeys[i];
      if (s) {
        var n = e.pressedKeys.indexOf(i);
        n > -1 && e.pressedKeys.splice(n, 1);
      }
    }, this.table.element.addEventListener("keydown", this.keyupBinding), this.table.element.addEventListener("keyup", this.keydownBinding);
  }
  clearBindings() {
    this.keyupBinding && this.table.element.removeEventListener("keydown", this.keyupBinding), this.keydownBinding && this.table.element.removeEventListener("keyup", this.keydownBinding);
  }
  checkBinding(e, t) {
    var i = !0;
    return e.ctrlKey == t.ctrl && e.shiftKey == t.shift && e.metaKey == t.meta ? (t.keys.forEach((s) => {
      var n = this.pressedKeys.indexOf(s);
      n == -1 && (i = !1);
    }), i && t.action.call(this, e), !0) : !1;
  }
};
R(Ae, "moduleName", "keybindings"), //load defaults
R(Ae, "bindings", nr), R(Ae, "actions", rr);
let ni = Ae;
class ts extends B {
  constructor(e) {
    super(e), this.menuContainer = null, this.nestedMenuBlock = !1, this.currentComponent = null, this.rootPopup = null, this.columnSubscribers = {}, this.registerTableOption("rowContextMenu", !1), this.registerTableOption("rowClickMenu", !1), this.registerTableOption("rowDblClickMenu", !1), this.registerTableOption("groupContextMenu", !1), this.registerTableOption("groupClickMenu", !1), this.registerTableOption("groupDblClickMenu", !1), this.registerColumnOption("headerContextMenu"), this.registerColumnOption("headerClickMenu"), this.registerColumnOption("headerDblClickMenu"), this.registerColumnOption("headerMenu"), this.registerColumnOption("headerMenuIcon"), this.registerColumnOption("contextMenu"), this.registerColumnOption("clickMenu"), this.registerColumnOption("dblClickMenu");
  }
  initialize() {
    this.deprecatedOptionsCheck(), this.initializeRowWatchers(), this.initializeGroupWatchers(), this.subscribe("column-init", this.initializeColumn.bind(this));
  }
  deprecatedOptionsCheck() {
  }
  initializeRowWatchers() {
    this.table.options.rowContextMenu && (this.subscribe("row-contextmenu", this.loadMenuEvent.bind(this, this.table.options.rowContextMenu)), this.table.on("rowTapHold", this.loadMenuEvent.bind(this, this.table.options.rowContextMenu))), this.table.options.rowClickMenu && this.subscribe("row-click", this.loadMenuEvent.bind(this, this.table.options.rowClickMenu)), this.table.options.rowDblClickMenu && this.subscribe("row-dblclick", this.loadMenuEvent.bind(this, this.table.options.rowDblClickMenu));
  }
  initializeGroupWatchers() {
    this.table.options.groupContextMenu && (this.subscribe("group-contextmenu", this.loadMenuEvent.bind(this, this.table.options.groupContextMenu)), this.table.on("groupTapHold", this.loadMenuEvent.bind(this, this.table.options.groupContextMenu))), this.table.options.groupClickMenu && this.subscribe("group-click", this.loadMenuEvent.bind(this, this.table.options.groupClickMenu)), this.table.options.groupDblClickMenu && this.subscribe("group-dblclick", this.loadMenuEvent.bind(this, this.table.options.groupDblClickMenu));
  }
  initializeColumn(e) {
    var t = e.definition;
    t.headerContextMenu && !this.columnSubscribers.headerContextMenu && (this.columnSubscribers.headerContextMenu = this.loadMenuTableColumnEvent.bind(this, "headerContextMenu"), this.subscribe("column-contextmenu", this.columnSubscribers.headerContextMenu), this.table.on("headerTapHold", this.loadMenuTableColumnEvent.bind(this, "headerContextMenu"))), t.headerClickMenu && !this.columnSubscribers.headerClickMenu && (this.columnSubscribers.headerClickMenu = this.loadMenuTableColumnEvent.bind(this, "headerClickMenu"), this.subscribe("column-click", this.columnSubscribers.headerClickMenu)), t.headerDblClickMenu && !this.columnSubscribers.headerDblClickMenu && (this.columnSubscribers.headerDblClickMenu = this.loadMenuTableColumnEvent.bind(this, "headerDblClickMenu"), this.subscribe("column-dblclick", this.columnSubscribers.headerDblClickMenu)), t.headerMenu && this.initializeColumnHeaderMenu(e), t.contextMenu && !this.columnSubscribers.contextMenu && (this.columnSubscribers.contextMenu = this.loadMenuTableCellEvent.bind(this, "contextMenu"), this.subscribe("cell-contextmenu", this.columnSubscribers.contextMenu), this.table.on("cellTapHold", this.loadMenuTableCellEvent.bind(this, "contextMenu"))), t.clickMenu && !this.columnSubscribers.clickMenu && (this.columnSubscribers.clickMenu = this.loadMenuTableCellEvent.bind(this, "clickMenu"), this.subscribe("cell-click", this.columnSubscribers.clickMenu)), t.dblClickMenu && !this.columnSubscribers.dblClickMenu && (this.columnSubscribers.dblClickMenu = this.loadMenuTableCellEvent.bind(this, "dblClickMenu"), this.subscribe("cell-dblclick", this.columnSubscribers.dblClickMenu));
  }
  initializeColumnHeaderMenu(e) {
    var t = e.definition.headerMenuIcon, i;
    i = document.createElement("span"), i.classList.add("tabulator-header-popup-button"), t ? (typeof t == "function" && (t = t(e.getComponent())), t instanceof HTMLElement ? i.appendChild(t) : i.innerHTML = t) : i.innerHTML = "&vellip;", i.addEventListener("click", (s) => {
      s.stopPropagation(), s.preventDefault(), this.loadMenuEvent(e.definition.headerMenu, s, e);
    }), e.titleElement.insertBefore(i, e.titleElement.firstChild);
  }
  loadMenuTableCellEvent(e, t, i) {
    i._cell && (i = i._cell), i.column.definition[e] && this.loadMenuEvent(i.column.definition[e], t, i);
  }
  loadMenuTableColumnEvent(e, t, i) {
    i._column && (i = i._column), i.definition[e] && this.loadMenuEvent(i.definition[e], t, i);
  }
  loadMenuEvent(e, t, i) {
    i._group ? i = i._group : i._row && (i = i._row), e = typeof e == "function" ? e.call(this.table, t, i.getComponent()) : e, this.loadMenu(t, i, e);
  }
  loadMenu(e, t, i, s, n) {
    var r = !(e instanceof MouseEvent), a = document.createElement("div"), l;
    if (a.classList.add("tabulator-menu"), r || e.preventDefault(), !(!i || !i.length)) {
      if (s)
        l = n.child(a);
      else {
        if (this.nestedMenuBlock) {
          if (this.rootPopup)
            return;
        } else
          this.nestedMenuBlock = setTimeout(() => {
            this.nestedMenuBlock = !1;
          }, 100);
        this.rootPopup && this.rootPopup.hide(), this.rootPopup = l = this.popup(a);
      }
      i.forEach((h) => {
        var d = document.createElement("div"), c = h.label, u = h.disabled;
        h.separator ? d.classList.add("tabulator-menu-separator") : (d.classList.add("tabulator-menu-item"), typeof c == "function" && (c = c.call(this.table, t.getComponent())), c instanceof Node ? d.appendChild(c) : d.innerHTML = c, typeof u == "function" && (u = u.call(this.table, t.getComponent())), u ? (d.classList.add("tabulator-menu-item-disabled"), d.addEventListener("click", (f) => {
          f.stopPropagation();
        })) : h.menu && h.menu.length ? d.addEventListener("click", (f) => {
          f.stopPropagation(), this.loadMenu(f, t, h.menu, d, l);
        }) : h.action && d.addEventListener("click", (f) => {
          h.action(f, t.getComponent());
        }), h.menu && h.menu.length && d.classList.add("tabulator-menu-item-submenu")), a.appendChild(d);
      }), a.addEventListener("click", (h) => {
        this.rootPopup && this.rootPopup.hide();
      }), l.show(s || e), l === this.rootPopup && (this.rootPopup.hideOnBlur(() => {
        this.rootPopup = null, this.currentComponent && (this.dispatch("menu-closed", i, l), this.dispatchExternal("menuClosed", this.currentComponent.getComponent()), this.currentComponent = null);
      }), this.currentComponent = t, this.dispatch("menu-opened", i, l), this.dispatchExternal("menuOpened", t.getComponent()));
    }
  }
}
R(ts, "moduleName", "menu");
class is extends B {
  constructor(e) {
    super(e), this.placeholderElement = this.createPlaceholderElement(), this.hoverElement = !1, this.checkTimeout = !1, this.checkPeriod = 250, this.moving = !1, this.toCol = !1, this.toColAfter = !1, this.startX = 0, this.autoScrollMargin = 40, this.autoScrollStep = 5, this.autoScrollTimeout = !1, this.touchMove = !1, this.moveHover = this.moveHover.bind(this), this.endMove = this.endMove.bind(this), this.registerTableOption("movableColumns", !1);
  }
  createPlaceholderElement() {
    var e = document.createElement("div");
    return e.classList.add("tabulator-col"), e.classList.add("tabulator-col-placeholder"), e;
  }
  initialize() {
    this.table.options.movableColumns && (this.subscribe("column-init", this.initializeColumn.bind(this)), this.subscribe("alert-show", this.abortMove.bind(this)));
  }
  abortMove() {
    clearTimeout(this.checkTimeout);
  }
  initializeColumn(e) {
    var t = this, i = {}, s;
    !e.modules.frozen && !e.isGroup && !e.isRowHeader && (s = e.getElement(), i.mousemove = (function(n) {
      e.parent === t.moving.parent && ((t.touchMove ? n.touches[0].pageX : n.pageX) - K.elOffset(s).left + t.table.columnManager.contentsElement.scrollLeft > e.getWidth() / 2 ? (t.toCol !== e || !t.toColAfter) && (s.parentNode.insertBefore(t.placeholderElement, s.nextSibling), t.moveColumn(e, !0)) : (t.toCol !== e || t.toColAfter) && (s.parentNode.insertBefore(t.placeholderElement, s), t.moveColumn(e, !1)));
    }).bind(t), s.addEventListener("mousedown", function(n) {
      t.touchMove = !1, n.which === 1 && (t.checkTimeout = setTimeout(function() {
        t.startMove(n, e);
      }, t.checkPeriod));
    }), s.addEventListener("mouseup", function(n) {
      n.which === 1 && t.checkTimeout && clearTimeout(t.checkTimeout);
    }), t.bindTouchEvents(e)), e.modules.moveColumn = i;
  }
  bindTouchEvents(e) {
    var t = e.getElement(), i = !1, s, n, r, a, l, h;
    t.addEventListener("touchstart", (d) => {
      this.checkTimeout = setTimeout(() => {
        this.touchMove = !0, s = e.nextColumn(), r = s ? s.getWidth() / 2 : 0, n = e.prevColumn(), a = n ? n.getWidth() / 2 : 0, l = 0, h = 0, i = !1, this.startMove(d, e);
      }, this.checkPeriod);
    }, { passive: !0 }), t.addEventListener("touchmove", (d) => {
      var c, u;
      this.moving && (this.moveHover(d), i || (i = d.touches[0].pageX), c = d.touches[0].pageX - i, c > 0 ? s && c - l > r && (u = s, u !== e && (i = d.touches[0].pageX, u.getElement().parentNode.insertBefore(this.placeholderElement, u.getElement().nextSibling), this.moveColumn(u, !0))) : n && -c - h > a && (u = n, u !== e && (i = d.touches[0].pageX, u.getElement().parentNode.insertBefore(this.placeholderElement, u.getElement()), this.moveColumn(u, !1))), u && (s = u.nextColumn(), l = r, r = s ? s.getWidth() / 2 : 0, n = u.prevColumn(), h = a, a = n ? n.getWidth() / 2 : 0));
    }, { passive: !0 }), t.addEventListener("touchend", (d) => {
      this.checkTimeout && clearTimeout(this.checkTimeout), this.moving && this.endMove(d);
    });
  }
  startMove(e, t) {
    var i = t.getElement(), s = this.table.columnManager.getContentsElement(), n = this.table.columnManager.getHeadersElement();
    this.table.modules.selectRange && this.table.modules.selectRange.columnSelection && this.table.modules.selectRange.mousedown && this.table.modules.selectRange.selecting === "column" || (this.moving = t, this.startX = (this.touchMove ? e.touches[0].pageX : e.pageX) - K.elOffset(i).left, this.table.element.classList.add("tabulator-block-select"), this.placeholderElement.style.width = t.getWidth() + "px", this.placeholderElement.style.height = t.getHeight() + "px", i.parentNode.insertBefore(this.placeholderElement, i), i.parentNode.removeChild(i), this.hoverElement = i.cloneNode(!0), this.hoverElement.classList.add("tabulator-moving"), s.appendChild(this.hoverElement), this.hoverElement.style.left = "0", this.hoverElement.style.bottom = s.clientHeight - n.offsetHeight + "px", this.touchMove || (this._bindMouseMove(), document.body.addEventListener("mousemove", this.moveHover), document.body.addEventListener("mouseup", this.endMove)), this.moveHover(e), this.dispatch("column-moving", e, this.moving));
  }
  _bindMouseMove() {
    this.table.columnManager.columnsByIndex.forEach(function(e) {
      e.modules.moveColumn.mousemove && e.getElement().addEventListener("mousemove", e.modules.moveColumn.mousemove);
    });
  }
  _unbindMouseMove() {
    this.table.columnManager.columnsByIndex.forEach(function(e) {
      e.modules.moveColumn.mousemove && e.getElement().removeEventListener("mousemove", e.modules.moveColumn.mousemove);
    });
  }
  moveColumn(e, t) {
    var i = this.moving.getCells();
    this.toCol = e, this.toColAfter = t, t ? e.getCells().forEach(function(s, n) {
      var r = s.getElement(!0);
      r.parentNode && i[n] && r.parentNode.insertBefore(i[n].getElement(), r.nextSibling);
    }) : e.getCells().forEach(function(s, n) {
      var r = s.getElement(!0);
      r.parentNode && i[n] && r.parentNode.insertBefore(i[n].getElement(), r);
    });
  }
  endMove(e) {
    (e.which === 1 || this.touchMove) && (this._unbindMouseMove(), this.placeholderElement.parentNode.insertBefore(this.moving.getElement(), this.placeholderElement.nextSibling), this.placeholderElement.parentNode.removeChild(this.placeholderElement), this.hoverElement.parentNode.removeChild(this.hoverElement), this.table.element.classList.remove("tabulator-block-select"), this.toCol && this.table.columnManager.moveColumnActual(this.moving, this.toCol, this.toColAfter), this.moving = !1, this.toCol = !1, this.toColAfter = !1, this.touchMove || (document.body.removeEventListener("mousemove", this.moveHover), document.body.removeEventListener("mouseup", this.endMove)));
  }
  moveHover(e) {
    var t = this.table.columnManager.getContentsElement(), i = t.scrollLeft, s = (this.touchMove ? e.touches[0].pageX : e.pageX) - K.elOffset(t).left + i, n;
    this.hoverElement.style.left = s - this.startX + "px", s - i < this.autoScrollMargin && (this.autoScrollTimeout || (this.autoScrollTimeout = setTimeout(() => {
      n = Math.max(0, i - 5), this.table.rowManager.getElement().scrollLeft = n, this.autoScrollTimeout = !1;
    }, 1))), i + t.clientWidth - s < this.autoScrollMargin && (this.autoScrollTimeout || (this.autoScrollTimeout = setTimeout(() => {
      n = Math.min(t.clientWidth, i + 5), this.table.rowManager.getElement().scrollLeft = n, this.autoScrollTimeout = !1;
    }, 1)));
  }
}
R(is, "moduleName", "moveColumn");
var or = {
  delete: function(o, e, t) {
    o.delete();
  }
}, ar = {
  insert: function(o, e, t) {
    return this.table.addRow(o.getData(), void 0, e), !0;
  },
  add: function(o, e, t) {
    return this.table.addRow(o.getData()), !0;
  },
  update: function(o, e, t) {
    return e ? (e.update(o.getData()), !0) : !1;
  },
  replace: function(o, e, t) {
    return e ? (this.table.addRow(o.getData(), void 0, e), e.delete(), !0) : !1;
  }
};
const Ve = class Ve extends B {
  constructor(e) {
    super(e), this.placeholderElement = this.createPlaceholderElement(), this.hoverElement = !1, this.checkTimeout = !1, this.checkPeriod = 150, this.moving = !1, this.toRow = !1, this.toRowAfter = !1, this.hasHandle = !1, this.startY = 0, this.startX = 0, this.moveHover = this.moveHover.bind(this), this.endMove = this.endMove.bind(this), this.tableRowDropEvent = !1, this.touchMove = !1, this.connection = !1, this.connectionSelectorsTables = !1, this.connectionSelectorsElements = !1, this.connectionElements = [], this.connections = [], this.connectedTable = !1, this.connectedRow = !1, this.registerTableOption("movableRows", !1), this.registerTableOption("movableRowsConnectedTables", !1), this.registerTableOption("movableRowsConnectedElements", !1), this.registerTableOption("movableRowsSender", !1), this.registerTableOption("movableRowsReceiver", "insert"), this.registerColumnOption("rowHandle");
  }
  createPlaceholderElement() {
    var e = document.createElement("div");
    return e.classList.add("tabulator-row"), e.classList.add("tabulator-row-placeholder"), e;
  }
  initialize() {
    this.table.options.movableRows && (this.connectionSelectorsTables = this.table.options.movableRowsConnectedTables, this.connectionSelectorsElements = this.table.options.movableRowsConnectedElements, this.connection = this.connectionSelectorsTables || this.connectionSelectorsElements, this.subscribe("cell-init", this.initializeCell.bind(this)), this.subscribe("column-init", this.initializeColumn.bind(this)), this.subscribe("row-init", this.initializeRow.bind(this)));
  }
  initializeGroupHeader(e) {
    var t = this, i = {};
    i.mouseup = (function(s) {
      t.tableRowDrop(s, e);
    }).bind(t), i.mousemove = (function(s) {
      var n;
      s.pageY - K.elOffset(e.element).top + t.table.rowManager.element.scrollTop > e.getHeight() / 2 ? (t.toRow !== e || !t.toRowAfter) && (n = e.getElement(), n.parentNode.insertBefore(t.placeholderElement, n.nextSibling), t.moveRow(e, !0)) : (t.toRow !== e || t.toRowAfter) && (n = e.getElement(), n.previousSibling && (n.parentNode.insertBefore(t.placeholderElement, n), t.moveRow(e, !1)));
    }).bind(t), e.modules.moveRow = i;
  }
  initializeRow(e) {
    var t = this, i = {}, s;
    i.mouseup = (function(n) {
      t.tableRowDrop(n, e);
    }).bind(t), i.mousemove = (function(n) {
      var r = e.getElement();
      n.pageY - K.elOffset(r).top + t.table.rowManager.element.scrollTop > e.getHeight() / 2 ? (t.toRow !== e || !t.toRowAfter) && (r.parentNode.insertBefore(t.placeholderElement, r.nextSibling), t.moveRow(e, !0)) : (t.toRow !== e || t.toRowAfter) && (r.parentNode.insertBefore(t.placeholderElement, r), t.moveRow(e, !1));
    }).bind(t), this.hasHandle || (s = e.getElement(), s.addEventListener("mousedown", function(n) {
      n.which === 1 && (t.checkTimeout = setTimeout(function() {
        t.startMove(n, e);
      }, t.checkPeriod));
    }), s.addEventListener("mouseup", function(n) {
      n.which === 1 && t.checkTimeout && clearTimeout(t.checkTimeout);
    }), this.bindTouchEvents(e, e.getElement())), e.modules.moveRow = i;
  }
  initializeColumn(e) {
    e.definition.rowHandle && this.table.options.movableRows !== !1 && (this.hasHandle = !0);
  }
  initializeCell(e) {
    if (e.column.definition.rowHandle && this.table.options.movableRows !== !1) {
      var t = this, i = e.getElement(!0);
      i.addEventListener("mousedown", function(s) {
        s.which === 1 && (t.checkTimeout = setTimeout(function() {
          t.startMove(s, e.row);
        }, t.checkPeriod));
      }), i.addEventListener("mouseup", function(s) {
        s.which === 1 && t.checkTimeout && clearTimeout(t.checkTimeout);
      }), this.bindTouchEvents(e.row, i);
    }
  }
  bindTouchEvents(e, t) {
    var i = !1, s, n, r, a, l, h;
    t.addEventListener("touchstart", (d) => {
      this.checkTimeout = setTimeout(() => {
        this.touchMove = !0, s = e.nextRow(), r = s ? s.getHeight() / 2 : 0, n = e.prevRow(), a = n ? n.getHeight() / 2 : 0, l = 0, h = 0, i = !1, this.startMove(d, e);
      }, this.checkPeriod);
    }, { passive: !0 }), this.moving, this.toRow, this.toRowAfter, t.addEventListener("touchmove", (d) => {
      var c, u;
      this.moving && (d.preventDefault(), this.moveHover(d), i || (i = d.touches[0].pageY), c = d.touches[0].pageY - i, c > 0 ? s && c - l > r && (u = s, u !== e && (i = d.touches[0].pageY, u.getElement().parentNode.insertBefore(this.placeholderElement, u.getElement().nextSibling), this.moveRow(u, !0))) : n && -c - h > a && (u = n, u !== e && (i = d.touches[0].pageY, u.getElement().parentNode.insertBefore(this.placeholderElement, u.getElement()), this.moveRow(u, !1))), u && (s = u.nextRow(), l = r, r = s ? s.getHeight() / 2 : 0, n = u.prevRow(), h = a, a = n ? n.getHeight() / 2 : 0));
    }), t.addEventListener("touchend", (d) => {
      this.checkTimeout && clearTimeout(this.checkTimeout), this.moving && (this.endMove(d), this.touchMove = !1);
    });
  }
  _bindMouseMove() {
    this.table.rowManager.getDisplayRows().forEach((e) => {
      (e.type === "row" || e.type === "group") && e.modules.moveRow && e.modules.moveRow.mousemove && e.getElement().addEventListener("mousemove", e.modules.moveRow.mousemove);
    });
  }
  _unbindMouseMove() {
    this.table.rowManager.getDisplayRows().forEach((e) => {
      (e.type === "row" || e.type === "group") && e.modules.moveRow && e.modules.moveRow.mousemove && e.getElement().removeEventListener("mousemove", e.modules.moveRow.mousemove);
    });
  }
  startMove(e, t) {
    var i = t.getElement();
    this.setStartPosition(e, t), this.moving = t, this.table.element.classList.add("tabulator-block-select"), this.placeholderElement.style.width = t.getWidth() + "px", this.placeholderElement.style.height = t.getHeight() + "px", this.connection ? (this.table.element.classList.add("tabulator-movingrow-sending"), this.connectToTables(t)) : (i.parentNode.insertBefore(this.placeholderElement, i), i.parentNode.removeChild(i)), this.hoverElement = i.cloneNode(!0), this.hoverElement.classList.add("tabulator-moving"), this.connection ? (document.body.appendChild(this.hoverElement), this.hoverElement.style.left = "0", this.hoverElement.style.top = "0", this.hoverElement.style.width = this.table.element.clientWidth + "px", this.hoverElement.style.whiteSpace = "nowrap", this.hoverElement.style.overflow = "hidden", this.hoverElement.style.pointerEvents = "none") : (this.table.rowManager.getTableElement().appendChild(this.hoverElement), this.hoverElement.style.left = "0", this.hoverElement.style.top = "0", this._bindMouseMove()), document.body.addEventListener("mousemove", this.moveHover), document.body.addEventListener("mouseup", this.endMove), this.dispatchExternal("rowMoving", t.getComponent()), this.moveHover(e);
  }
  setStartPosition(e, t) {
    var i = this.touchMove ? e.touches[0].pageX : e.pageX, s = this.touchMove ? e.touches[0].pageY : e.pageY, n, r;
    n = t.getElement(), this.connection ? (r = n.getBoundingClientRect(), this.startX = r.left - i + window.pageXOffset, this.startY = r.top - s + window.pageYOffset) : this.startY = s - n.getBoundingClientRect().top;
  }
  endMove(e) {
    (!e || e.which === 1 || this.touchMove) && (this._unbindMouseMove(), this.connection || (this.placeholderElement.parentNode.insertBefore(this.moving.getElement(), this.placeholderElement.nextSibling), this.placeholderElement.parentNode.removeChild(this.placeholderElement)), this.hoverElement.parentNode.removeChild(this.hoverElement), this.table.element.classList.remove("tabulator-block-select"), this.toRow ? this.table.rowManager.moveRow(this.moving, this.toRow, this.toRowAfter) : this.dispatchExternal("rowMoveCancelled", this.moving.getComponent()), this.moving = !1, this.toRow = !1, this.toRowAfter = !1, document.body.removeEventListener("mousemove", this.moveHover), document.body.removeEventListener("mouseup", this.endMove), this.connection && (this.table.element.classList.remove("tabulator-movingrow-sending"), this.disconnectFromTables()));
  }
  moveRow(e, t) {
    this.toRow = e, this.toRowAfter = t;
  }
  moveHover(e) {
    this.connection ? this.moveHoverConnections.call(this, e) : this.moveHoverTable.call(this, e);
  }
  moveHoverTable(e) {
    var t = this.table.rowManager.getElement(), i = t.scrollTop, s = (this.touchMove ? e.touches[0].pageY : e.pageY) - t.getBoundingClientRect().top + i;
    this.hoverElement.style.top = Math.min(s - this.startY, this.table.rowManager.element.scrollHeight - this.hoverElement.offsetHeight) + "px";
  }
  moveHoverConnections(e) {
    this.hoverElement.style.left = this.startX + (this.touchMove ? e.touches[0].pageX : e.pageX) + "px", this.hoverElement.style.top = this.startY + (this.touchMove ? e.touches[0].pageY : e.pageY) + "px";
  }
  elementRowDrop(e, t, i) {
    this.dispatchExternal("movableRowsElementDrop", e, t, i ? i.getComponent() : !1);
  }
  //establish connection with other tables
  connectToTables(e) {
    var t;
    this.connectionSelectorsTables && (t = this.commsConnections(this.connectionSelectorsTables), this.dispatchExternal("movableRowsSendingStart", t), this.commsSend(this.connectionSelectorsTables, "moveRow", "connect", {
      row: e
    })), this.connectionSelectorsElements && (this.connectionElements = [], Array.isArray(this.connectionSelectorsElements) || (this.connectionSelectorsElements = [this.connectionSelectorsElements]), this.connectionSelectorsElements.forEach((i) => {
      typeof i == "string" ? this.connectionElements = this.connectionElements.concat(Array.prototype.slice.call(document.querySelectorAll(i))) : this.connectionElements.push(i);
    }), this.connectionElements.forEach((i) => {
      var s = (n) => {
        this.elementRowDrop(n, i, this.moving);
      };
      i.addEventListener("mouseup", s), i.tabulatorElementDropEvent = s, i.classList.add("tabulator-movingrow-receiving");
    }));
  }
  //disconnect from other tables
  disconnectFromTables() {
    var e;
    this.connectionSelectorsTables && (e = this.commsConnections(this.connectionSelectorsTables), this.dispatchExternal("movableRowsSendingStop", e), this.commsSend(this.connectionSelectorsTables, "moveRow", "disconnect")), this.connectionElements.forEach((t) => {
      t.classList.remove("tabulator-movingrow-receiving"), t.removeEventListener("mouseup", t.tabulatorElementDropEvent), delete t.tabulatorElementDropEvent;
    });
  }
  //accept incomming connection
  connect(e, t) {
    return this.connectedTable ? (console.warn("Move Row Error - Table cannot accept connection, already connected to table:", this.connectedTable), !1) : (this.connectedTable = e, this.connectedRow = t, this.table.element.classList.add("tabulator-movingrow-receiving"), this.table.rowManager.getDisplayRows().forEach((i) => {
      i.type === "row" && i.modules.moveRow && i.modules.moveRow.mouseup && i.getElement().addEventListener("mouseup", i.modules.moveRow.mouseup);
    }), this.tableRowDropEvent = this.tableRowDrop.bind(this), this.table.element.addEventListener("mouseup", this.tableRowDropEvent), this.dispatchExternal("movableRowsReceivingStart", t, e), !0);
  }
  //close incoming connection
  disconnect(e) {
    e === this.connectedTable ? (this.connectedTable = !1, this.connectedRow = !1, this.table.element.classList.remove("tabulator-movingrow-receiving"), this.table.rowManager.getDisplayRows().forEach((t) => {
      t.type === "row" && t.modules.moveRow && t.modules.moveRow.mouseup && t.getElement().removeEventListener("mouseup", t.modules.moveRow.mouseup);
    }), this.table.element.removeEventListener("mouseup", this.tableRowDropEvent), this.dispatchExternal("movableRowsReceivingStop", e)) : console.warn("Move Row Error - trying to disconnect from non connected table");
  }
  dropComplete(e, t, i) {
    var s = !1;
    if (i) {
      switch (typeof this.table.options.movableRowsSender) {
        case "string":
          s = Ve.senders[this.table.options.movableRowsSender];
          break;
        case "function":
          s = this.table.options.movableRowsSender;
          break;
      }
      s ? s.call(this, this.moving ? this.moving.getComponent() : void 0, t ? t.getComponent() : void 0, e) : this.table.options.movableRowsSender && console.warn("Mover Row Error - no matching sender found:", this.table.options.movableRowsSender), this.dispatchExternal("movableRowsSent", this.moving.getComponent(), t ? t.getComponent() : void 0, e);
    } else
      this.dispatchExternal("movableRowsSentFailed", this.moving.getComponent(), t ? t.getComponent() : void 0, e);
    this.endMove();
  }
  tableRowDrop(e, t) {
    var i = !1, s = !1;
    switch (e.stopImmediatePropagation(), typeof this.table.options.movableRowsReceiver) {
      case "string":
        i = Ve.receivers[this.table.options.movableRowsReceiver];
        break;
      case "function":
        i = this.table.options.movableRowsReceiver;
        break;
    }
    i ? s = i.call(this, this.connectedRow.getComponent(), t ? t.getComponent() : void 0, this.connectedTable) : console.warn("Mover Row Error - no matching receiver found:", this.table.options.movableRowsReceiver), s ? this.dispatchExternal("movableRowsReceived", this.connectedRow.getComponent(), t ? t.getComponent() : void 0, this.connectedTable) : this.dispatchExternal("movableRowsReceivedFailed", this.connectedRow.getComponent(), t ? t.getComponent() : void 0, this.connectedTable), this.commsSend(this.connectedTable, "moveRow", "dropcomplete", {
      row: t,
      success: s
    });
  }
  commsReceived(e, t, i) {
    switch (t) {
      case "connect":
        return this.connect(e, i.row);
      case "disconnect":
        return this.disconnect(e);
      case "dropcomplete":
        return this.dropComplete(e, i.row, i.success);
    }
  }
};
R(Ve, "moduleName", "moveRow"), //load defaults
R(Ve, "senders", or), R(Ve, "receivers", ar);
let ri = Ve;
var lr = {};
const Ze = class Ze extends B {
  constructor(e) {
    super(e), this.allowedTypes = ["", "data", "edit", "clipboard", "import"], this.enabled = !0, this.registerColumnOption("mutator"), this.registerColumnOption("mutatorParams"), this.registerColumnOption("mutatorData"), this.registerColumnOption("mutatorDataParams"), this.registerColumnOption("mutatorEdit"), this.registerColumnOption("mutatorEditParams"), this.registerColumnOption("mutatorClipboard"), this.registerColumnOption("mutatorClipboardParams"), this.registerColumnOption("mutatorImport"), this.registerColumnOption("mutatorImportParams"), this.registerColumnOption("mutateLink");
  }
  initialize() {
    this.subscribe("cell-value-changing", this.transformCell.bind(this)), this.subscribe("cell-value-changed", this.mutateLink.bind(this)), this.subscribe("column-layout", this.initializeColumn.bind(this)), this.subscribe("row-data-init-before", this.rowDataChanged.bind(this)), this.subscribe("row-data-changing", this.rowDataChanged.bind(this));
  }
  rowDataChanged(e, t, i) {
    return this.transformRow(t, "data", i);
  }
  //initialize column mutator
  initializeColumn(e) {
    var t = !1, i = {};
    this.allowedTypes.forEach((s) => {
      var n = "mutator" + (s.charAt(0).toUpperCase() + s.slice(1)), r;
      e.definition[n] && (r = this.lookupMutator(e.definition[n]), r && (t = !0, i[n] = {
        mutator: r,
        params: e.definition[n + "Params"] || {}
      }));
    }), t && (e.modules.mutate = i);
  }
  lookupMutator(e) {
    var t = !1;
    switch (typeof e) {
      case "string":
        Ze.mutators[e] ? t = Ze.mutators[e] : console.warn("Mutator Error - No such mutator found, ignoring: ", e);
        break;
      case "function":
        t = e;
        break;
    }
    return t;
  }
  //apply mutator to row
  transformRow(e, t, i) {
    var s = "mutator" + (t.charAt(0).toUpperCase() + t.slice(1)), n;
    return this.enabled && this.table.columnManager.traverse((r) => {
      var a, l, h;
      r.modules.mutate && (a = r.modules.mutate[s] || r.modules.mutate.mutator || !1, a && (n = r.getFieldValue(typeof i < "u" ? i : e), (t == "data" && !i || typeof n < "u") && (h = r.getComponent(), l = typeof a.params == "function" ? a.params(n, e, t, h) : a.params, r.setFieldValue(e, a.mutator(n, e, t, l, h)))));
    }), e;
  }
  //apply mutator to new cell value
  transformCell(e, t) {
    if (e.column.modules.mutate) {
      var i = e.column.modules.mutate.mutatorEdit || e.column.modules.mutate.mutator || !1, s = {};
      if (i)
        return s = Object.assign(s, e.row.getData()), e.column.setFieldValue(s, t), i.mutator(t, s, "edit", i.params, e.getComponent());
    }
    return t;
  }
  mutateLink(e) {
    var t = e.column.definition.mutateLink;
    t && (Array.isArray(t) || (t = [t]), t.forEach((i) => {
      var s = e.row.getCell(i);
      s && s.setValue(s.getValue(), !0, !0);
    }));
  }
  enable() {
    this.enabled = !0;
  }
  disable() {
    this.enabled = !1;
  }
};
R(Ze, "moduleName", "mutator"), //load defaults
R(Ze, "mutators", lr);
let oi = Ze;
function hr(o, e, t, i, s) {
  var n = document.createElement("span"), r = document.createElement("span"), a = document.createElement("span"), l = document.createElement("span"), h = document.createElement("span"), d = document.createElement("span");
  return this.table.modules.localize.langBind("pagination|counter|showing", (c) => {
    r.innerHTML = c;
  }), this.table.modules.localize.langBind("pagination|counter|of", (c) => {
    l.innerHTML = c;
  }), this.table.modules.localize.langBind("pagination|counter|rows", (c) => {
    d.innerHTML = c;
  }), i ? (a.innerHTML = " " + e + "-" + Math.min(e + o - 1, i) + " ", h.innerHTML = " " + i + " ", n.appendChild(r), n.appendChild(a), n.appendChild(l), n.appendChild(h), n.appendChild(d)) : (a.innerHTML = " 0 ", n.appendChild(r), n.appendChild(a), n.appendChild(d)), n;
}
function dr(o, e, t, i, s) {
  var n = document.createElement("span"), r = document.createElement("span"), a = document.createElement("span"), l = document.createElement("span"), h = document.createElement("span"), d = document.createElement("span");
  return this.table.modules.localize.langBind("pagination|counter|showing", (c) => {
    r.innerHTML = c;
  }), a.innerHTML = " " + t + " ", this.table.modules.localize.langBind("pagination|counter|of", (c) => {
    l.innerHTML = c;
  }), h.innerHTML = " " + s + " ", this.table.modules.localize.langBind("pagination|counter|pages", (c) => {
    d.innerHTML = c;
  }), n.appendChild(r), n.appendChild(a), n.appendChild(l), n.appendChild(h), n.appendChild(d), n;
}
var ur = {
  rows: hr,
  pages: dr
};
const lt = class lt extends B {
  constructor(e) {
    super(e), this.mode = "local", this.progressiveLoad = !1, this.element = null, this.pageCounterElement = null, this.pageCounter = null, this.size = 0, this.page = 1, this.count = 5, this.max = 1, this.remoteRowCountEstimate = null, this.initialLoad = !0, this.dataChanging = !1, this.pageSizes = [], this.registerTableOption("pagination", !1), this.registerTableOption("paginationMode", "local"), this.registerTableOption("paginationSize", !1), this.registerTableOption("paginationInitialPage", 1), this.registerTableOption("paginationCounter", !1), this.registerTableOption("paginationCounterElement", !1), this.registerTableOption("paginationButtonCount", 5), this.registerTableOption("paginationSizeSelector", !1), this.registerTableOption("paginationElement", !1), this.registerTableOption("paginationAddRow", "page"), this.registerTableOption("paginationOutOfRange", !1), this.registerTableOption("progressiveLoad", !1), this.registerTableOption("progressiveLoadDelay", 0), this.registerTableOption("progressiveLoadScrollMargin", 0), this.registerTableFunction("setMaxPage", this.setMaxPage.bind(this)), this.registerTableFunction("setPage", this.setPage.bind(this)), this.registerTableFunction("setPageToRow", this.userSetPageToRow.bind(this)), this.registerTableFunction("setPageSize", this.userSetPageSize.bind(this)), this.registerTableFunction("getPageSize", this.getPageSize.bind(this)), this.registerTableFunction("previousPage", this.previousPage.bind(this)), this.registerTableFunction("nextPage", this.nextPage.bind(this)), this.registerTableFunction("getPage", this.getPage.bind(this)), this.registerTableFunction("getPageMax", this.getPageMax.bind(this)), this.registerComponentFunction("row", "pageTo", this.setPageToRow.bind(this));
  }
  initialize() {
    this.table.options.pagination ? (this.subscribe("row-deleted", this.rowsUpdated.bind(this)), this.subscribe("row-added", this.rowsUpdated.bind(this)), this.subscribe("data-processed", this.initialLoadComplete.bind(this)), this.subscribe("table-built", this.calculatePageSizes.bind(this)), this.subscribe("footer-redraw", this.footerRedraw.bind(this)), this.table.options.paginationAddRow == "page" && this.subscribe("row-adding-position", this.rowAddingPosition.bind(this)), this.table.options.paginationMode === "remote" && (this.subscribe("data-params", this.remotePageParams.bind(this)), this.subscribe("data-loaded", this._parseRemoteData.bind(this))), this.table.options.progressiveLoad && console.error("Progressive Load Error - Pagination and progressive load cannot be used at the same time"), this.registerDisplayHandler(this.restOnRenderBefore.bind(this), 40), this.registerDisplayHandler(this.getRows.bind(this), 50), this.createElements(), this.initializePageCounter(), this.initializePaginator()) : this.table.options.progressiveLoad && (this.subscribe("data-params", this.remotePageParams.bind(this)), this.subscribe("data-loaded", this._parseRemoteData.bind(this)), this.subscribe("table-built", this.calculatePageSizes.bind(this)), this.subscribe("data-processed", this.initialLoadComplete.bind(this)), this.initializeProgressive(this.table.options.progressiveLoad), this.table.options.progressiveLoad === "scroll" && this.subscribe("scroll-vertical", this.scrollVertical.bind(this)));
  }
  rowAddingPosition(e, t) {
    var i = this.table.rowManager, s = i.getDisplayRows(), n;
    return t ? s.length ? n = s[0] : i.activeRows.length && (n = i.activeRows[i.activeRows.length - 1], t = !1) : s.length && (n = s[s.length - 1], t = !(s.length < this.size)), { index: n, top: t };
  }
  calculatePageSizes() {
    var e, t;
    this.table.options.paginationSize ? this.size = this.table.options.paginationSize : (e = document.createElement("div"), e.classList.add("tabulator-row"), e.style.visibility = "hidden", t = document.createElement("div"), t.classList.add("tabulator-cell"), t.innerHTML = "Page Row Test", e.appendChild(t), this.table.rowManager.getTableElement().appendChild(e), this.size = Math.floor(this.table.rowManager.getElement().clientHeight / e.offsetHeight), this.table.rowManager.getTableElement().removeChild(e)), this.dispatchExternal("pageSizeChanged", this.size), this.generatePageSizeSelectList();
  }
  initialLoadComplete() {
    this.initialLoad = !1;
  }
  remotePageParams(e, t, i, s) {
    return this.initialLoad || (this.progressiveLoad && !i || !this.progressiveLoad && !this.dataChanging) && this.reset(!0), s.page = this.page, this.size && (s.size = this.size), s;
  }
  ///////////////////////////////////
  ///////// Table Functions /////////
  ///////////////////////////////////
  userSetPageToRow(e) {
    return this.table.options.pagination && (e = this.table.rowManager.findRow(e), e) ? this.setPageToRow(e) : Promise.reject();
  }
  userSetPageSize(e) {
    return this.table.options.pagination ? (this.setPageSize(e), this.setPage(1)) : !1;
  }
  ///////////////////////////////////
  ///////// Internal Logic //////////
  ///////////////////////////////////
  scrollVertical(e, t) {
    var i, s, n;
    !t && !this.table.dataLoader.loading && (i = this.table.rowManager.getElement(), s = i.scrollHeight - i.clientHeight - e, n = this.table.options.progressiveLoadScrollMargin || i.clientHeight * 2, s < n && this.nextPage().catch(() => {
    }));
  }
  restOnRenderBefore(e, t) {
    return t || this.mode === "local" && this.reset(), e;
  }
  rowsUpdated() {
    this.refreshData(!0, "all");
  }
  createElements() {
    var e;
    this.element = document.createElement("span"), this.element.classList.add("tabulator-paginator"), this.pagesElement = document.createElement("span"), this.pagesElement.classList.add("tabulator-pages"), e = document.createElement("button"), e.classList.add("tabulator-page"), e.setAttribute("type", "button"), e.setAttribute("role", "button"), e.setAttribute("aria-label", ""), e.setAttribute("title", ""), this.firstBut = e.cloneNode(!0), this.firstBut.setAttribute("data-page", "first"), this.prevBut = e.cloneNode(!0), this.prevBut.setAttribute("data-page", "prev"), this.nextBut = e.cloneNode(!0), this.nextBut.setAttribute("data-page", "next"), this.lastBut = e.cloneNode(!0), this.lastBut.setAttribute("data-page", "last"), this.table.options.paginationSizeSelector && (this.pageSizeSelect = document.createElement("select"), this.pageSizeSelect.classList.add("tabulator-page-size"));
  }
  generatePageSizeSelectList() {
    var e = [];
    if (this.pageSizeSelect) {
      if (Array.isArray(this.table.options.paginationSizeSelector))
        e = this.table.options.paginationSizeSelector, this.pageSizes = e, this.pageSizes.indexOf(this.size) == -1 && e.unshift(this.size);
      else if (this.pageSizes.indexOf(this.size) == -1) {
        e = [];
        for (let t = 1; t < 5; t++)
          e.push(this.size * t);
        this.pageSizes = e;
      } else
        e = this.pageSizes;
      for (; this.pageSizeSelect.firstChild; ) this.pageSizeSelect.removeChild(this.pageSizeSelect.firstChild);
      e.forEach((t) => {
        var i = document.createElement("option");
        i.value = t, t === !0 ? this.langBind("pagination|all", function(s) {
          i.innerHTML = s;
        }) : i.innerHTML = t, this.pageSizeSelect.appendChild(i);
      }), this.pageSizeSelect.value = this.size;
    }
  }
  initializePageCounter() {
    var e = this.table.options.paginationCounter, t = null;
    e && (typeof e == "function" ? t = e : t = lt.pageCounters[e], t ? (this.pageCounter = t, this.pageCounterElement = document.createElement("span"), this.pageCounterElement.classList.add("tabulator-page-counter")) : console.warn("Pagination Error - No such page counter found: ", e));
  }
  //setup pagination
  initializePaginator(e) {
    var t, i;
    e || (this.langBind("pagination|first", (s) => {
      this.firstBut.innerHTML = s;
    }), this.langBind("pagination|first_title", (s) => {
      this.firstBut.setAttribute("aria-label", s), this.firstBut.setAttribute("title", s);
    }), this.langBind("pagination|prev", (s) => {
      this.prevBut.innerHTML = s;
    }), this.langBind("pagination|prev_title", (s) => {
      this.prevBut.setAttribute("aria-label", s), this.prevBut.setAttribute("title", s);
    }), this.langBind("pagination|next", (s) => {
      this.nextBut.innerHTML = s;
    }), this.langBind("pagination|next_title", (s) => {
      this.nextBut.setAttribute("aria-label", s), this.nextBut.setAttribute("title", s);
    }), this.langBind("pagination|last", (s) => {
      this.lastBut.innerHTML = s;
    }), this.langBind("pagination|last_title", (s) => {
      this.lastBut.setAttribute("aria-label", s), this.lastBut.setAttribute("title", s);
    }), this.firstBut.addEventListener("click", () => {
      this.setPage(1);
    }), this.prevBut.addEventListener("click", () => {
      this.previousPage();
    }), this.nextBut.addEventListener("click", () => {
      this.nextPage();
    }), this.lastBut.addEventListener("click", () => {
      this.setPage(this.max);
    }), this.table.options.paginationElement && (this.element = this.table.options.paginationElement), this.pageSizeSelect && (t = document.createElement("label"), this.langBind("pagination|page_size", (s) => {
      this.pageSizeSelect.setAttribute("aria-label", s), this.pageSizeSelect.setAttribute("title", s), t.innerHTML = s;
    }), this.element.appendChild(t), this.element.appendChild(this.pageSizeSelect), this.pageSizeSelect.addEventListener("change", (s) => {
      this.setPageSize(this.pageSizeSelect.value == "true" ? !0 : this.pageSizeSelect.value), this.setPage(1);
    })), this.element.appendChild(this.firstBut), this.element.appendChild(this.prevBut), this.element.appendChild(this.pagesElement), this.element.appendChild(this.nextBut), this.element.appendChild(this.lastBut), this.table.options.paginationElement || (this.table.options.paginationCounter && (this.table.options.paginationCounterElement ? this.table.options.paginationCounterElement instanceof HTMLElement ? this.table.options.paginationCounterElement.appendChild(this.pageCounterElement) : typeof this.table.options.paginationCounterElement == "string" && (i = document.querySelector(this.table.options.paginationCounterElement), i ? i.appendChild(this.pageCounterElement) : console.warn("Pagination Error - Unable to find element matching paginationCounterElement selector:", this.table.options.paginationCounterElement)) : this.footerAppend(this.pageCounterElement)), this.footerAppend(this.element)), this.page = this.table.options.paginationInitialPage, this.count = this.table.options.paginationButtonCount), this.mode = this.table.options.paginationMode;
  }
  initializeProgressive(e) {
    this.initializePaginator(!0), this.mode = "progressive_" + e, this.progressiveLoad = !0;
  }
  trackChanges() {
    this.dispatch("page-changed");
  }
  //calculate maximum page from number of rows
  setMaxRows(e) {
    e ? this.max = this.size === !0 ? 1 : Math.ceil(e / this.size) : this.max = 1, this.page > this.max && (this.page = this.max);
  }
  //reset to first page without triggering action
  reset(e) {
    this.initialLoad || (this.mode == "local" || e) && (this.page = 1, this.trackChanges());
  }
  //set the maximum page
  setMaxPage(e) {
    e = parseInt(e), this.max = e || 1, this.page > this.max && (this.page = this.max, this.trigger());
  }
  //set current page number
  setPage(e) {
    switch (e) {
      case "first":
        return this.setPage(1);
      case "prev":
        return this.previousPage();
      case "next":
        return this.nextPage();
      case "last":
        return this.setPage(this.max);
    }
    return e = parseInt(e), e > 0 && e <= this.max || this.mode !== "local" ? (this.page = e, this.trackChanges(), this.trigger()) : (console.warn("Pagination Error - Requested page is out of range of 1 - " + this.max + ":", e), Promise.reject());
  }
  setPageToRow(e) {
    var t = this.displayRows(-1), i = t.indexOf(e);
    if (i > -1) {
      var s = this.size === !0 ? 1 : Math.ceil((i + 1) / this.size);
      return this.setPage(s);
    } else
      return console.warn("Pagination Error - Requested row is not visible"), Promise.reject();
  }
  setPageSize(e) {
    e !== !0 && (e = parseInt(e)), e > 0 && (this.size = e, this.dispatchExternal("pageSizeChanged", e)), this.pageSizeSelect && this.generatePageSizeSelectList(), this.trackChanges();
  }
  _setPageCounter(e, t, i) {
    var s;
    if (this.pageCounter)
      switch (this.mode === "remote" && (t = this.size, i = (this.page - 1) * this.size + 1, e = this.remoteRowCountEstimate), s = this.pageCounter.call(this, t, i, this.page, e, this.max), typeof s) {
        case "object":
          if (s instanceof Node) {
            for (; this.pageCounterElement.firstChild; ) this.pageCounterElement.removeChild(this.pageCounterElement.firstChild);
            this.pageCounterElement.appendChild(s);
          } else
            this.pageCounterElement.innerHTML = "", s != null && console.warn("Page Counter Error - Page Counter has returned a type of object, the only valid page counter object return is an instance of Node, the page counter returned:", s);
          break;
        case "undefined":
          this.pageCounterElement.innerHTML = "";
          break;
        default:
          this.pageCounterElement.innerHTML = s;
      }
  }
  //setup the pagination buttons
  _setPageButtons() {
    let e = Math.floor((this.count - 1) / 2), t = Math.ceil((this.count - 1) / 2), i = this.max - this.page + e + 1 < this.count ? this.max - this.count + 1 : Math.max(this.page - e, 1), s = this.page <= t ? Math.min(this.count, this.max) : Math.min(this.page + t, this.max);
    for (; this.pagesElement.firstChild; ) this.pagesElement.removeChild(this.pagesElement.firstChild);
    this.page == 1 ? (this.firstBut.disabled = !0, this.prevBut.disabled = !0) : (this.firstBut.disabled = !1, this.prevBut.disabled = !1), this.page == this.max ? (this.lastBut.disabled = !0, this.nextBut.disabled = !0) : (this.lastBut.disabled = !1, this.nextBut.disabled = !1);
    for (let n = i; n <= s; n++)
      n > 0 && n <= this.max && this.pagesElement.appendChild(this._generatePageButton(n));
    this.footerRedraw();
  }
  _generatePageButton(e) {
    var t = document.createElement("button");
    return t.classList.add("tabulator-page"), e == this.page && t.classList.add("active"), t.setAttribute("type", "button"), t.setAttribute("role", "button"), this.langBind("pagination|page_title", (i) => {
      t.setAttribute("aria-label", i + " " + e), t.setAttribute("title", i + " " + e);
    }), t.setAttribute("data-page", e), t.textContent = e, t.addEventListener("click", (i) => {
      this.setPage(e);
    }), t;
  }
  //previous page
  previousPage() {
    return this.page > 1 ? (this.page--, this.trackChanges(), this.trigger()) : (console.warn("Pagination Error - Previous page would be less than page 1:", 0), Promise.reject());
  }
  //next page
  nextPage() {
    return this.page < this.max ? (this.page++, this.trackChanges(), this.trigger()) : (this.progressiveLoad || console.warn("Pagination Error - Next page would be greater than maximum page of " + this.max + ":", this.max + 1), Promise.reject());
  }
  //return current page number
  getPage() {
    return this.page;
  }
  //return max page number
  getPageMax() {
    return this.max;
  }
  getPageSize(e) {
    return this.size;
  }
  getMode() {
    return this.mode;
  }
  //return appropriate rows for current page
  getRows(e) {
    var t = 0, i, s, n, r, a = e.filter((l) => l.type === "row");
    if (this.mode == "local") {
      i = [], this.setMaxRows(e.length), this.size === !0 ? (s = 0, n = e.length) : (s = this.size * (this.page - 1), n = s + parseInt(this.size)), this._setPageButtons();
      for (let l = s; l < n; l++) {
        let h = e[l];
        h && (i.push(h), h.type === "row" && (r || (r = h), t++));
      }
      return this._setPageCounter(a.length, t, r ? a.indexOf(r) + 1 : 0), i;
    } else
      return this._setPageButtons(), this._setPageCounter(a.length), e.slice(0);
  }
  trigger() {
    var e;
    switch (this.mode) {
      case "local":
        return e = this.table.rowManager.scrollLeft, this.refreshData(), this.table.rowManager.scrollHorizontal(e), this.dispatchExternal("pageLoaded", this.getPage()), Promise.resolve();
      case "remote":
        return this.dataChanging = !0, this.reloadData(null).finally(() => {
          this.dataChanging = !1;
        });
      case "progressive_load":
      case "progressive_scroll":
        return this.reloadData(null, !0);
      default:
        return console.warn("Pagination Error - no such pagination mode:", this.mode), Promise.reject();
    }
  }
  _parseRemoteData(e) {
    var t, i;
    if (typeof e.last_page > "u" && console.warn("Remote Pagination Error - Server response missing '" + (this.options("dataReceiveParams").last_page || "last_page") + "' property"), e.data)
      if (this.max = parseInt(e.last_page) || 1, this.remoteRowCountEstimate = typeof e.last_row < "u" ? e.last_row : e.last_page * this.size - (this.page == e.last_page ? this.size - e.data.length : 0), this.progressiveLoad) {
        switch (this.mode) {
          case "progressive_load":
            this.page == 1 ? this.table.rowManager.setData(e.data, !1, this.page == 1) : this.table.rowManager.addRows(e.data), this.page < this.max && setTimeout(() => {
              this.nextPage();
            }, this.table.options.progressiveLoadDelay);
            break;
          case "progressive_scroll":
            e = this.page === 1 ? e.data : this.table.rowManager.getData().concat(e.data), this.table.rowManager.setData(e, this.page !== 1, this.page == 1), t = this.table.options.progressiveLoadScrollMargin || this.table.rowManager.element.clientHeight * 2, this.table.rowManager.element.scrollHeight <= this.table.rowManager.element.clientHeight + t && this.page < this.max && setTimeout(() => {
              this.nextPage();
            });
            break;
        }
        return !1;
      } else {
        if (this.page > this.max && (console.warn("Remote Pagination Error - Server returned last page value lower than the current page"), i = this.options("paginationOutOfRange"), i))
          return this.setPage(typeof i == "function" ? i.call(this, this.page, this.max) : i);
        this.dispatchExternal("pageLoaded", this.getPage());
      }
    else
      console.warn("Remote Pagination Error - Server response missing '" + (this.options("dataReceiveParams").data || "data") + "' property");
    return e.data;
  }
  //handle the footer element being redrawn
  footerRedraw() {
    var e = this.table.footerManager.containerElement;
    Math.ceil(e.clientWidth) - e.scrollWidth < 0 ? this.pagesElement.style.display = "none" : (this.pagesElement.style.display = "", Math.ceil(e.clientWidth) - e.scrollWidth < 0 && (this.pagesElement.style.display = "none"));
  }
};
R(lt, "moduleName", "page"), //load defaults
R(lt, "pageCounters", ur);
let ai = lt;
var cr = {
  local: function(o, e) {
    var t = localStorage.getItem(o + "-" + e);
    return t ? JSON.parse(t) : !1;
  },
  cookie: function(o, e) {
    var t = document.cookie, i = o + "-" + e, s = t.indexOf(i + "="), n, r;
    return s > -1 && (t = t.slice(s), n = t.indexOf(";"), n > -1 && (t = t.slice(0, n)), r = t.replace(i + "=", "")), r ? JSON.parse(r) : !1;
  }
}, fr = {
  local: function(o, e, t) {
    localStorage.setItem(o + "-" + e, JSON.stringify(t));
  },
  cookie: function(o, e, t) {
    var i = /* @__PURE__ */ new Date();
    i.setDate(i.getDate() + 1e4), document.cookie = o + "-" + e + "=" + JSON.stringify(t) + "; expires=" + i.toUTCString();
  }
};
const le = class le extends B {
  constructor(e) {
    super(e), this.mode = "", this.id = "", this.defWatcherBlock = !1, this.config = {}, this.readFunc = !1, this.writeFunc = !1, this.registerTableOption("persistence", !1), this.registerTableOption("persistenceID", ""), this.registerTableOption("persistenceMode", !0), this.registerTableOption("persistenceReaderFunc", !1), this.registerTableOption("persistenceWriterFunc", !1);
  }
  // Test for whether localStorage is available for use.
  localStorageTest() {
    var e = "_tabulator_test";
    try {
      return window.localStorage.setItem(e, e), window.localStorage.removeItem(e), !0;
    } catch {
      return !1;
    }
  }
  //setup parameters
  initialize() {
    if (this.table.options.persistence) {
      var e = this.table.options.persistenceMode, t = this.table.options.persistenceID, i;
      this.mode = e !== !0 ? e : this.localStorageTest() ? "local" : "cookie", this.table.options.persistenceReaderFunc ? typeof this.table.options.persistenceReaderFunc == "function" ? this.readFunc = this.table.options.persistenceReaderFunc : le.readers[this.table.options.persistenceReaderFunc] ? this.readFunc = le.readers[this.table.options.persistenceReaderFunc] : console.warn("Persistence Read Error - invalid reader set", this.table.options.persistenceReaderFunc) : le.readers[this.mode] ? this.readFunc = le.readers[this.mode] : console.warn("Persistence Read Error - invalid reader set", this.mode), this.table.options.persistenceWriterFunc ? typeof this.table.options.persistenceWriterFunc == "function" ? this.writeFunc = this.table.options.persistenceWriterFunc : le.writers[this.table.options.persistenceWriterFunc] ? this.writeFunc = le.writers[this.table.options.persistenceWriterFunc] : console.warn("Persistence Write Error - invalid reader set", this.table.options.persistenceWriterFunc) : le.writers[this.mode] ? this.writeFunc = le.writers[this.mode] : console.warn("Persistence Write Error - invalid writer set", this.mode), this.id = "tabulator-" + (t || this.table.element.getAttribute("id") || ""), this.config = {
        sort: this.table.options.persistence === !0 || this.table.options.persistence.sort,
        filter: this.table.options.persistence === !0 || this.table.options.persistence.filter,
        headerFilter: this.table.options.persistence === !0 || this.table.options.persistence.headerFilter,
        group: this.table.options.persistence === !0 || this.table.options.persistence.group,
        page: this.table.options.persistence === !0 || this.table.options.persistence.page,
        columns: this.table.options.persistence === !0 ? ["title", "width", "visible"] : this.table.options.persistence.columns
      }, this.config.page && (i = this.retrieveData("page"), i && (typeof i.paginationSize < "u" && (this.config.page === !0 || this.config.page.size) && (this.table.options.paginationSize = i.paginationSize), typeof i.paginationInitialPage < "u" && (this.config.page === !0 || this.config.page.page) && (this.table.options.paginationInitialPage = i.paginationInitialPage))), this.config.group && (i = this.retrieveData("group"), i && (typeof i.groupBy < "u" && (this.config.group === !0 || this.config.group.groupBy) && (this.table.options.groupBy = i.groupBy), typeof i.groupStartOpen < "u" && (this.config.group === !0 || this.config.group.groupStartOpen) && (this.table.options.groupStartOpen = i.groupStartOpen), typeof i.groupHeader < "u" && (this.config.group === !0 || this.config.group.groupHeader) && (this.table.options.groupHeader = i.groupHeader))), this.config.columns && (this.table.options.columns = this.load("columns", this.table.options.columns), this.subscribe("column-init", this.initializeColumn.bind(this)), this.subscribe("column-show", this.save.bind(this, "columns")), this.subscribe("column-hide", this.save.bind(this, "columns")), this.subscribe("column-moved", this.save.bind(this, "columns"))), this.subscribe("table-built", this.tableBuilt.bind(this), 0), this.subscribe("table-redraw", this.tableRedraw.bind(this)), this.subscribe("filter-changed", this.eventSave.bind(this, "filter")), this.subscribe("filter-changed", this.eventSave.bind(this, "headerFilter")), this.subscribe("sort-changed", this.eventSave.bind(this, "sort")), this.subscribe("group-changed", this.eventSave.bind(this, "group")), this.subscribe("page-changed", this.eventSave.bind(this, "page")), this.subscribe("column-resized", this.eventSave.bind(this, "columns")), this.subscribe("column-width", this.eventSave.bind(this, "columns")), this.subscribe("layout-refreshed", this.eventSave.bind(this, "columns"));
    }
    this.registerTableFunction("getColumnLayout", this.getColumnLayout.bind(this)), this.registerTableFunction("setColumnLayout", this.setColumnLayout.bind(this));
  }
  eventSave(e) {
    this.config[e] && this.save(e);
  }
  tableBuilt() {
    var e, t, i;
    this.config.sort && (e = this.load("sort"), e && (this.table.options.initialSort = e)), this.config.filter && (t = this.load("filter"), t && (this.table.options.initialFilter = t)), this.config.headerFilter && (i = this.load("headerFilter"), i && (this.table.options.initialHeaderFilter = i));
  }
  tableRedraw(e) {
    e && this.config.columns && this.save("columns");
  }
  ///////////////////////////////////
  ///////// Table Functions /////////
  ///////////////////////////////////
  getColumnLayout() {
    return this.parseColumns(this.table.columnManager.getColumns());
  }
  setColumnLayout(e) {
    return this.table.columnManager.setColumns(this.mergeDefinition(this.table.options.columns, e, !0)), !0;
  }
  ///////////////////////////////////
  ///////// Internal Logic //////////
  ///////////////////////////////////
  initializeColumn(e) {
    var t, i;
    this.config.columns && (this.defWatcherBlock = !0, t = e.getDefinition(), i = this.config.columns === !0 ? Object.keys(t) : this.config.columns, i.forEach((s) => {
      var n = Object.getOwnPropertyDescriptor(t, s), r = t[s];
      n && Object.defineProperty(t, s, {
        set: (a) => {
          r = a, this.defWatcherBlock || this.save("columns"), n.set && n.set(a);
        },
        get: () => (n.get && n.get(), r)
      });
    }), this.defWatcherBlock = !1);
  }
  //load saved definitions
  load(e, t) {
    var i = this.retrieveData(e);
    return t && (i = i ? this.mergeDefinition(t, i) : t), i;
  }
  //retrieve data from memory
  retrieveData(e) {
    return this.readFunc ? this.readFunc(this.id, e) : !1;
  }
  //merge old and new column definitions
  mergeDefinition(e, t, i) {
    var s = [];
    return t = t || [], t.forEach((n, r) => {
      var a = this._findColumn(e, n), l;
      a && (i ? l = Object.keys(n) : this.config.columns === !0 || this.config.columns == null ? (l = Object.keys(a), l.push("width")) : l = this.config.columns, l.forEach((h) => {
        h !== "columns" && typeof n[h] < "u" && (a[h] = n[h]);
      }), a.columns && (a.columns = this.mergeDefinition(a.columns, n.columns)), s.push(a));
    }), e.forEach((n, r) => {
      var a = this._findColumn(t, n);
      a || (s.length > r ? s.splice(r, 0, n) : s.push(n));
    }), s;
  }
  //find matching columns
  _findColumn(e, t) {
    var i = t.columns ? "group" : t.field ? "field" : "object";
    return e.find(function(s) {
      switch (i) {
        case "group":
          return s.title === t.title && s.columns.length === t.columns.length;
        case "field":
          return s.field === t.field;
        case "object":
          return s === t;
      }
    });
  }
  //save data
  save(e) {
    var t = {};
    switch (e) {
      case "columns":
        t = this.parseColumns(this.table.columnManager.getColumns());
        break;
      case "filter":
        t = this.table.modules.filter.getFilters();
        break;
      case "headerFilter":
        t = this.table.modules.filter.getHeaderFilters();
        break;
      case "sort":
        t = this.validateSorters(this.table.modules.sort.getSort());
        break;
      case "group":
        t = this.getGroupConfig();
        break;
      case "page":
        t = this.getPageConfig();
        break;
    }
    this.writeFunc && this.writeFunc(this.id, e, t);
  }
  //ensure sorters contain no function data
  validateSorters(e) {
    return e.forEach(function(t) {
      t.column = t.field, delete t.field;
    }), e;
  }
  getGroupConfig() {
    var e = {};
    return this.config.group && ((this.config.group === !0 || this.config.group.groupBy) && (e.groupBy = this.table.options.groupBy), (this.config.group === !0 || this.config.group.groupStartOpen) && (e.groupStartOpen = this.table.options.groupStartOpen), (this.config.group === !0 || this.config.group.groupHeader) && (e.groupHeader = this.table.options.groupHeader)), e;
  }
  getPageConfig() {
    var e = {};
    return this.config.page && ((this.config.page === !0 || this.config.page.size) && (e.paginationSize = this.table.modules.page.getPageSize()), (this.config.page === !0 || this.config.page.page) && (e.paginationInitialPage = this.table.modules.page.getPage())), e;
  }
  //parse columns for data to store
  parseColumns(e) {
    var t = [], i = ["headerContextMenu", "headerMenu", "contextMenu", "clickMenu"];
    return e.forEach((s) => {
      var n = {}, r = s.getDefinition(), a;
      s.isGroup ? (n.title = r.title, n.columns = this.parseColumns(s.getColumns())) : (n.field = s.getField(), this.config.columns === !0 || this.config.columns == null ? (a = Object.keys(r), a.push("width"), a.push("visible")) : a = this.config.columns, a.forEach((l) => {
        switch (l) {
          case "width":
            n.width = s.getWidth();
            break;
          case "visible":
            n.visible = s.visible;
            break;
          default:
            typeof r[l] != "function" && i.indexOf(l) === -1 && (n[l] = r[l]);
        }
      })), t.push(n);
    }), t;
  }
};
R(le, "moduleName", "persistence"), R(le, "moduleInitOrder", -10), //load defaults
R(le, "readers", cr), R(le, "writers", fr);
let li = le;
class ss extends B {
  constructor(e) {
    super(e), this.columnSubscribers = {}, this.registerTableOption("rowContextPopup", !1), this.registerTableOption("rowClickPopup", !1), this.registerTableOption("rowDblClickPopup", !1), this.registerTableOption("groupContextPopup", !1), this.registerTableOption("groupClickPopup", !1), this.registerTableOption("groupDblClickPopup", !1), this.registerColumnOption("headerContextPopup"), this.registerColumnOption("headerClickPopup"), this.registerColumnOption("headerDblClickPopup"), this.registerColumnOption("headerPopup"), this.registerColumnOption("headerPopupIcon"), this.registerColumnOption("contextPopup"), this.registerColumnOption("clickPopup"), this.registerColumnOption("dblClickPopup"), this.registerComponentFunction("cell", "popup", this._componentPopupCall.bind(this)), this.registerComponentFunction("column", "popup", this._componentPopupCall.bind(this)), this.registerComponentFunction("row", "popup", this._componentPopupCall.bind(this)), this.registerComponentFunction("group", "popup", this._componentPopupCall.bind(this));
  }
  initialize() {
    this.initializeRowWatchers(), this.initializeGroupWatchers(), this.subscribe("column-init", this.initializeColumn.bind(this));
  }
  _componentPopupCall(e, t, i) {
    this.loadPopupEvent(t, null, e, i);
  }
  initializeRowWatchers() {
    this.table.options.rowContextPopup && (this.subscribe("row-contextmenu", this.loadPopupEvent.bind(this, this.table.options.rowContextPopup)), this.table.on("rowTapHold", this.loadPopupEvent.bind(this, this.table.options.rowContextPopup))), this.table.options.rowClickPopup && this.subscribe("row-click", this.loadPopupEvent.bind(this, this.table.options.rowClickPopup)), this.table.options.rowDblClickPopup && this.subscribe("row-dblclick", this.loadPopupEvent.bind(this, this.table.options.rowDblClickPopup));
  }
  initializeGroupWatchers() {
    this.table.options.groupContextPopup && (this.subscribe("group-contextmenu", this.loadPopupEvent.bind(this, this.table.options.groupContextPopup)), this.table.on("groupTapHold", this.loadPopupEvent.bind(this, this.table.options.groupContextPopup))), this.table.options.groupClickPopup && this.subscribe("group-click", this.loadPopupEvent.bind(this, this.table.options.groupClickPopup)), this.table.options.groupDblClickPopup && this.subscribe("group-dblclick", this.loadPopupEvent.bind(this, this.table.options.groupDblClickPopup));
  }
  initializeColumn(e) {
    var t = e.definition;
    t.headerContextPopup && !this.columnSubscribers.headerContextPopup && (this.columnSubscribers.headerContextPopup = this.loadPopupTableColumnEvent.bind(this, "headerContextPopup"), this.subscribe("column-contextmenu", this.columnSubscribers.headerContextPopup), this.table.on("headerTapHold", this.loadPopupTableColumnEvent.bind(this, "headerContextPopup"))), t.headerClickPopup && !this.columnSubscribers.headerClickPopup && (this.columnSubscribers.headerClickPopup = this.loadPopupTableColumnEvent.bind(this, "headerClickPopup"), this.subscribe("column-click", this.columnSubscribers.headerClickPopup)), t.headerDblClickPopup && !this.columnSubscribers.headerDblClickPopup && (this.columnSubscribers.headerDblClickPopup = this.loadPopupTableColumnEvent.bind(this, "headerDblClickPopup"), this.subscribe("column-dblclick", this.columnSubscribers.headerDblClickPopup)), t.headerPopup && this.initializeColumnHeaderPopup(e), t.contextPopup && !this.columnSubscribers.contextPopup && (this.columnSubscribers.contextPopup = this.loadPopupTableCellEvent.bind(this, "contextPopup"), this.subscribe("cell-contextmenu", this.columnSubscribers.contextPopup), this.table.on("cellTapHold", this.loadPopupTableCellEvent.bind(this, "contextPopup"))), t.clickPopup && !this.columnSubscribers.clickPopup && (this.columnSubscribers.clickPopup = this.loadPopupTableCellEvent.bind(this, "clickPopup"), this.subscribe("cell-click", this.columnSubscribers.clickPopup)), t.dblClickPopup && !this.columnSubscribers.dblClickPopup && (this.columnSubscribers.dblClickPopup = this.loadPopupTableCellEvent.bind(this, "dblClickPopup"), this.subscribe("cell-click", this.columnSubscribers.dblClickPopup));
  }
  initializeColumnHeaderPopup(e) {
    var t = e.definition.headerPopupIcon, i;
    i = document.createElement("span"), i.classList.add("tabulator-header-popup-button"), t ? (typeof t == "function" && (t = t(e.getComponent())), t instanceof HTMLElement ? i.appendChild(t) : i.innerHTML = t) : i.innerHTML = "&vellip;", i.addEventListener("click", (s) => {
      s.stopPropagation(), s.preventDefault(), this.loadPopupEvent(e.definition.headerPopup, s, e);
    }), e.titleElement.insertBefore(i, e.titleElement.firstChild);
  }
  loadPopupTableCellEvent(e, t, i) {
    i._cell && (i = i._cell), i.column.definition[e] && this.loadPopupEvent(i.column.definition[e], t, i);
  }
  loadPopupTableColumnEvent(e, t, i) {
    i._column && (i = i._column), i.definition[e] && this.loadPopupEvent(i.definition[e], t, i);
  }
  loadPopupEvent(e, t, i, s) {
    var n;
    function r(a) {
      n = a;
    }
    i._group ? i = i._group : i._row && (i = i._row), e = typeof e == "function" ? e.call(this.table, t, i.getComponent(), r) : e, this.loadPopup(t, i, e, n, s);
  }
  loadPopup(e, t, i, s, n) {
    var r = !(e instanceof MouseEvent), a, l;
    i instanceof HTMLElement ? a = i : (a = document.createElement("div"), a.innerHTML = i), a.classList.add("tabulator-popup"), a.addEventListener("click", (h) => {
      h.stopPropagation();
    }), r || e.preventDefault(), l = this.popup(a), typeof s == "function" && l.renderCallback(s), e ? l.show(e) : l.show(t.getElement(), n || "center"), l.hideOnBlur(() => {
      this.dispatchExternal("popupClosed", t.getComponent());
    }), this.dispatchExternal("popupOpened", t.getComponent());
  }
}
R(ss, "moduleName", "popup");
class ns extends B {
  constructor(e) {
    super(e), this.element = !1, this.manualBlock = !1, this.beforeprintEventHandler = null, this.afterprintEventHandler = null, this.registerTableOption("printAsHtml", !1), this.registerTableOption("printFormatter", !1), this.registerTableOption("printHeader", !1), this.registerTableOption("printFooter", !1), this.registerTableOption("printStyled", !0), this.registerTableOption("printRowRange", "visible"), this.registerTableOption("printConfig", {}), this.registerColumnOption("print"), this.registerColumnOption("titlePrint");
  }
  initialize() {
    this.table.options.printAsHtml && (this.beforeprintEventHandler = this.replaceTable.bind(this), this.afterprintEventHandler = this.cleanup.bind(this), window.addEventListener("beforeprint", this.beforeprintEventHandler), window.addEventListener("afterprint", this.afterprintEventHandler), this.subscribe("table-destroy", this.destroy.bind(this))), this.registerTableFunction("print", this.printFullscreen.bind(this));
  }
  destroy() {
    this.table.options.printAsHtml && (window.removeEventListener("beforeprint", this.beforeprintEventHandler), window.removeEventListener("afterprint", this.afterprintEventHandler));
  }
  ///////////////////////////////////
  ///////// Table Functions /////////
  ///////////////////////////////////
  ///////////////////////////////////
  ///////// Internal Logic //////////
  ///////////////////////////////////
  replaceTable() {
    this.manualBlock || (this.element = document.createElement("div"), this.element.classList.add("tabulator-print-table"), this.element.appendChild(this.table.modules.export.generateTable(this.table.options.printConfig, this.table.options.printStyled, this.table.options.printRowRange, "print")), this.table.element.style.display = "none", this.table.element.parentNode.insertBefore(this.element, this.table.element));
  }
  cleanup() {
    document.body.classList.remove("tabulator-print-fullscreen-hide"), this.element && this.element.parentNode && (this.element.parentNode.removeChild(this.element), this.table.element.style.display = "");
  }
  printFullscreen(e, t, i) {
    var s = window.scrollX, n = window.scrollY, r = document.createElement("div"), a = document.createElement("div"), l = this.table.modules.export.generateTable(typeof i < "u" ? i : this.table.options.printConfig, typeof t < "u" ? t : this.table.options.printStyled, e || this.table.options.printRowRange, "print"), h, d;
    this.manualBlock = !0, this.element = document.createElement("div"), this.element.classList.add("tabulator-print-fullscreen"), this.table.options.printHeader && (r.classList.add("tabulator-print-header"), h = typeof this.table.options.printHeader == "function" ? this.table.options.printHeader.call(this.table) : this.table.options.printHeader, typeof h == "string" ? r.innerHTML = h : r.appendChild(h), this.element.appendChild(r)), this.element.appendChild(l), this.table.options.printFooter && (a.classList.add("tabulator-print-footer"), d = typeof this.table.options.printFooter == "function" ? this.table.options.printFooter.call(this.table) : this.table.options.printFooter, typeof d == "string" ? a.innerHTML = d : a.appendChild(d), this.element.appendChild(a)), document.body.classList.add("tabulator-print-fullscreen-hide"), document.body.appendChild(this.element), this.table.options.printFormatter && this.table.options.printFormatter(this.element, l), window.print(), this.cleanup(), window.scrollTo(s, n), this.manualBlock = !1;
  }
}
R(ns, "moduleName", "print");
class rs extends B {
  constructor(e) {
    super(e), this.data = !1, this.blocked = !1, this.origFuncs = {}, this.currentVersion = 0, this.registerTableOption("reactiveData", !1);
  }
  initialize() {
    this.table.options.reactiveData && (this.subscribe("cell-value-save-before", this.block.bind(this, "cellsave")), this.subscribe("cell-value-save-after", this.unblock.bind(this, "cellsave")), this.subscribe("row-data-save-before", this.block.bind(this, "rowsave")), this.subscribe("row-data-save-after", this.unblock.bind(this, "rowsave")), this.subscribe("row-data-init-after", this.watchRow.bind(this)), this.subscribe("data-processing", this.watchData.bind(this)), this.subscribe("table-destroy", this.unwatchData.bind(this)));
  }
  watchData(e) {
    var t = this, i;
    this.currentVersion++, i = this.currentVersion, this.unwatchData(), this.data = e, this.origFuncs.push = e.push, Object.defineProperty(this.data, "push", {
      enumerable: !1,
      configurable: !0,
      value: function() {
        var s = Array.from(arguments), n;
        return !t.blocked && i === t.currentVersion && (t.block("data-push"), s.forEach((r) => {
          t.table.rowManager.addRowActual(r, !1);
        }), n = Array.prototype.push.apply(e, arguments), t.unblock("data-push")), n;
      }
    }), this.origFuncs.unshift = e.unshift, Object.defineProperty(this.data, "unshift", {
      enumerable: !1,
      configurable: !0,
      value: function() {
        var s = Array.from(arguments), n;
        return !t.blocked && i === t.currentVersion && (t.block("data-unshift"), s.forEach((r) => {
          t.table.rowManager.addRowActual(r, !0);
        }), n = Array.prototype.unshift.apply(e, arguments), t.unblock("data-unshift")), n;
      }
    }), this.origFuncs.shift = e.shift, Object.defineProperty(this.data, "shift", {
      enumerable: !1,
      configurable: !0,
      value: function() {
        var s, n;
        return !t.blocked && i === t.currentVersion && (t.block("data-shift"), t.data.length && (s = t.table.rowManager.getRowFromDataObject(t.data[0]), s && s.deleteActual()), n = Array.prototype.shift.call(e), t.unblock("data-shift")), n;
      }
    }), this.origFuncs.pop = e.pop, Object.defineProperty(this.data, "pop", {
      enumerable: !1,
      configurable: !0,
      value: function() {
        var s, n;
        return !t.blocked && i === t.currentVersion && (t.block("data-pop"), t.data.length && (s = t.table.rowManager.getRowFromDataObject(t.data[t.data.length - 1]), s && s.deleteActual()), n = Array.prototype.pop.call(e), t.unblock("data-pop")), n;
      }
    }), this.origFuncs.splice = e.splice, Object.defineProperty(this.data, "splice", {
      enumerable: !1,
      configurable: !0,
      value: function() {
        var s = Array.from(arguments), n = s[0] < 0 ? e.length + s[0] : s[0], r = s[1], a = s[2] ? s.slice(2) : !1, l, h;
        if (!t.blocked && i === t.currentVersion) {
          if (t.block("data-splice"), a && (l = e[n] ? t.table.rowManager.getRowFromDataObject(e[n]) : !1, l ? a.forEach((c) => {
            t.table.rowManager.addRowActual(c, !0, l, !0);
          }) : (a = a.slice().reverse(), a.forEach((c) => {
            t.table.rowManager.addRowActual(c, !0, !1, !0);
          }))), r !== 0) {
            var d = e.slice(n, typeof s[1] > "u" ? s[1] : n + r);
            d.forEach((c, u) => {
              var f = t.table.rowManager.getRowFromDataObject(c);
              f && f.deleteActual(u !== d.length - 1);
            });
          }
          (a || r !== 0) && t.table.rowManager.reRenderInPosition(), h = Array.prototype.splice.apply(e, arguments), t.unblock("data-splice");
        }
        return h;
      }
    });
  }
  unwatchData() {
    if (this.data !== !1)
      for (var e in this.origFuncs)
        Object.defineProperty(this.data, e, {
          enumerable: !0,
          configurable: !0,
          writable: !0,
          value: this.origFuncs[e]
        });
  }
  watchRow(e) {
    var t = e.getData();
    for (var i in t)
      this.watchKey(e, t, i);
    this.table.options.dataTree && this.watchTreeChildren(e);
  }
  watchTreeChildren(e) {
    var t = this, i = e.getData()[this.table.options.dataTreeChildField];
    i && (Object.defineProperty(i, "push", {
      enumerable: !1,
      configurable: !0,
      value: function() {
        var s;
        return t.blocked || (t.block("tree-push"), s = Array.prototype.push.apply(i, arguments), t.rebuildTree(e), t.unblock("tree-push")), s;
      }
    }), Object.defineProperty(i, "unshift", {
      enumerable: !1,
      configurable: !0,
      value: function() {
        var s;
        return t.blocked || (t.block("tree-unshift"), s = Array.prototype.unshift.apply(i, arguments), t.rebuildTree(e), t.unblock("tree-unshift")), s;
      }
    }), Object.defineProperty(i, "shift", {
      enumerable: !1,
      configurable: !0,
      value: function() {
        var s;
        return t.blocked || (t.block("tree-shift"), s = Array.prototype.shift.call(i), t.rebuildTree(e), t.unblock("tree-shift")), s;
      }
    }), Object.defineProperty(i, "pop", {
      enumerable: !1,
      configurable: !0,
      value: function() {
        var s;
        return t.blocked || (t.block("tree-pop"), s = Array.prototype.pop.call(i), t.rebuildTree(e), t.unblock("tree-pop")), s;
      }
    }), Object.defineProperty(i, "splice", {
      enumerable: !1,
      configurable: !0,
      value: function() {
        var s;
        return t.blocked || (t.block("tree-splice"), s = Array.prototype.splice.apply(i, arguments), t.rebuildTree(e), t.unblock("tree-splice")), s;
      }
    }));
  }
  rebuildTree(e) {
    this.table.modules.dataTree.initializeRow(e), this.table.modules.dataTree.layoutRow(e), this.table.rowManager.refreshActiveData("tree", !1, !0);
  }
  watchKey(e, t, i) {
    var s = this, n = Object.getOwnPropertyDescriptor(t, i), r = t[i], a = this.currentVersion;
    Object.defineProperty(t, i, {
      set: (l) => {
        if (r = l, !s.blocked && a === s.currentVersion) {
          s.block("key");
          var h = {};
          h[i] = l, e.updateData(h), s.unblock("key");
        }
        n.set && n.set(l);
      },
      get: () => (n.get && n.get(), r)
    });
  }
  unwatchRow(e) {
    var t = e.getData();
    for (var i in t)
      Object.defineProperty(t, i, {
        value: t[i]
      });
  }
  block(e) {
    this.blocked || (this.blocked = e);
  }
  unblock(e) {
    this.blocked === e && (this.blocked = !1);
  }
}
R(rs, "moduleName", "reactiveData");
class os extends B {
  constructor(e) {
    super(e), this.startColumn = !1, this.startX = !1, this.startWidth = !1, this.latestX = !1, this.handle = null, this.initialNextColumn = null, this.nextColumn = null, this.initialized = !1, this.registerColumnOption("resizable", !0), this.registerTableOption("resizableColumnFit", !1), this.registerTableOption("resizableColumnGuide", !1);
  }
  initialize() {
    this.subscribe("column-rendered", this.layoutColumnHeader.bind(this));
  }
  initializeEventWatchers() {
    this.initialized || (this.subscribe("cell-rendered", this.layoutCellHandles.bind(this)), this.subscribe("cell-delete", this.deInitializeComponent.bind(this)), this.subscribe("cell-height", this.resizeHandle.bind(this)), this.subscribe("column-moved", this.columnLayoutUpdated.bind(this)), this.subscribe("column-hide", this.deInitializeColumn.bind(this)), this.subscribe("column-show", this.columnLayoutUpdated.bind(this)), this.subscribe("column-width", this.columnWidthUpdated.bind(this)), this.subscribe("column-delete", this.deInitializeComponent.bind(this)), this.subscribe("column-height", this.resizeHandle.bind(this)), this.initialized = !0);
  }
  layoutCellHandles(e) {
    e.row.type === "row" && (this.deInitializeComponent(e), this.initializeColumn("cell", e, e.column, e.element));
  }
  layoutColumnHeader(e) {
    e.definition.resizable && (this.initializeEventWatchers(), this.deInitializeComponent(e), this.initializeColumn("header", e, e, e.element));
  }
  columnLayoutUpdated(e) {
    var t = e.prevColumn();
    this.reinitializeColumn(e), t && this.reinitializeColumn(t);
  }
  columnWidthUpdated(e) {
    e.modules.frozen && (this.table.modules.frozenColumns.leftColumns.includes(e) ? this.table.modules.frozenColumns.leftColumns.forEach((t) => {
      this.reinitializeColumn(t);
    }) : this.table.modules.frozenColumns.rightColumns.includes(e) && this.table.modules.frozenColumns.rightColumns.forEach((t) => {
      this.reinitializeColumn(t);
    }));
  }
  frozenColumnOffset(e) {
    var t = !1;
    return e.modules.frozen && (t = e.modules.frozen.marginValue, e.modules.frozen.position === "left" ? t += e.getWidth() - 3 : t && (t -= 3)), t !== !1 ? t + "px" : !1;
  }
  reinitializeColumn(e) {
    var t = this.frozenColumnOffset(e);
    e.cells.forEach((i) => {
      i.modules.resize && i.modules.resize.handleEl && (t && (i.modules.resize.handleEl.style[e.modules.frozen.position] = t, i.modules.resize.handleEl.style["z-index"] = 11), i.element.after(i.modules.resize.handleEl));
    }), e.modules.resize && e.modules.resize.handleEl && (t && (e.modules.resize.handleEl.style[e.modules.frozen.position] = t), e.element.after(e.modules.resize.handleEl));
  }
  initializeColumn(e, t, i, s) {
    var n = this, r = !1, a = i.definition.resizable, l = {}, h = i.getLastColumn();
    if (e === "header" && (r = i.definition.formatter == "textarea" || i.definition.variableHeight, l = { variableHeight: r }), (a === !0 || a == e) && this._checkResizability(h)) {
      var d = document.createElement("span");
      d.className = "tabulator-col-resize-handle", d.addEventListener("click", function(u) {
        u.stopPropagation();
      });
      var c = function(u) {
        n.startColumn = i, n.initialNextColumn = n.nextColumn = h.nextColumn(), n._mouseDown(u, h, d);
      };
      d.addEventListener("mousedown", c), d.addEventListener("touchstart", c, { passive: !0 }), d.addEventListener("dblclick", (u) => {
        var f = h.getWidth();
        u.stopPropagation(), h.reinitializeWidth(!0), f !== h.getWidth() && (n.dispatch("column-resized", h), n.dispatchExternal("columnResized", h.getComponent()));
      }), i.modules.frozen && (d.style.position = "sticky", d.style[i.modules.frozen.position] = this.frozenColumnOffset(i)), e === "cell" && (d.style.height = t.row.heightStyled), l.handleEl = d, s.parentNode && i.visible && s.after(d);
    }
    t.modules.resize = l;
  }
  deInitializeColumn(e) {
    this.deInitializeComponent(e), e.cells.forEach((t) => {
      this.deInitializeComponent(t);
    });
  }
  deInitializeComponent(e) {
    var t;
    e.modules.resize && (t = e.modules.resize.handleEl, t && t.parentElement && t.parentElement.removeChild(t));
  }
  resizeHandle(e, t) {
    e.modules.resize && e.modules.resize.handleEl && (e.modules.resize.handleEl.style.height = t);
  }
  getResizingClientX(e) {
    var i, s;
    if (typeof e.clientX < "u") return e.clientX;
    const t = this.table.options.resizableColumnGuide ? (i = e.changedTouches) == null ? void 0 : i[0] : (s = e.touches) == null ? void 0 : s[0];
    return t == null ? void 0 : t.clientX;
  }
  resize(e, t) {
    var i = this.getResizingClientX(e);
    if (typeof i != "number" || !isFinite(i)) {
      console.warn("ResizeColumns: could not resolve pointer X from event", e);
      return;
    }
    var s = i - this.startX, n = i - this.latestX, r, a;
    if (this.latestX = i, this.table.rtl && (s = -s, n = -n), r = t.width == t.minWidth || t.width == t.maxWidth, t.setWidth(this.startWidth + s), a = t.width == t.minWidth || t.width == t.maxWidth, n < 0 && (this.nextColumn = this.initialNextColumn), this.table.options.resizableColumnFit && this.nextColumn && !(r && a)) {
      let l = this.nextColumn.getWidth();
      n > 0 && l <= this.nextColumn.minWidth && (this.nextColumn = this.nextColumn.nextColumn()), this.nextColumn && this.nextColumn.setWidth(this.nextColumn.getWidth() - n);
    }
    this.table.columnManager.rerenderColumns(!0), !this.table.browserSlow && t.modules.resize && t.modules.resize.variableHeight && t.checkCellHeights();
  }
  calcGuidePosition(e, t, i) {
    var s = typeof e.clientX > "u" ? e.touches[0].clientX : e.clientX, n = i.getBoundingClientRect().x - this.table.element.getBoundingClientRect().x, r = this.table.element.getBoundingClientRect().x, a = t.element.getBoundingClientRect().left - r, l = s - this.startX, h = Math.max(n + l, a + t.minWidth);
    return t.maxWidth && (h = Math.min(h, a + t.maxWidth)), h;
  }
  _checkResizability(e) {
    return e.definition.resizable;
  }
  _mouseDown(e, t, i) {
    var s = this, n;
    this.dispatchExternal("columnResizing", t.getComponent()), s.table.options.resizableColumnGuide && (n = document.createElement("span"), n.classList.add("tabulator-col-resize-guide"), s.table.element.appendChild(n), setTimeout(() => {
      n.style.left = s.calcGuidePosition(e, t, i) + "px";
    })), s.table.element.classList.add("tabulator-block-select");
    function r(l) {
      s.table.options.resizableColumnGuide ? n.style.left = s.calcGuidePosition(l, t, i) + "px" : s.resize(l, t);
    }
    function a(l) {
      s.table.options.resizableColumnGuide && (s.resize(l, t), n.remove()), s.startColumn.modules.edit && (s.startColumn.modules.edit.blocked = !1), s.table.browserSlow && t.modules.resize && t.modules.resize.variableHeight && t.checkCellHeights(), document.body.removeEventListener("mouseup", a), document.body.removeEventListener("mousemove", r), i.removeEventListener("touchmove", r), i.removeEventListener("touchend", a), s.table.element.classList.remove("tabulator-block-select"), s.startWidth !== t.getWidth() && (s.table.columnManager.verticalAlignHeaders(), s.dispatch("column-resized", t), s.dispatchExternal("columnResized", t.getComponent()));
    }
    e.stopPropagation(), s.startColumn.modules.edit && (s.startColumn.modules.edit.blocked = !0), s.startX = typeof e.clientX > "u" ? e.touches[0].clientX : e.clientX, s.latestX = s.startX, s.startWidth = t.getWidth(), document.body.addEventListener("mousemove", r), document.body.addEventListener("mouseup", a), i.addEventListener("touchmove", r, { passive: !0 }), i.addEventListener("touchend", a);
  }
}
R(os, "moduleName", "resizeColumns");
class as extends B {
  constructor(e) {
    super(e), this.startColumn = !1, this.startY = !1, this.startHeight = !1, this.handle = null, this.prevHandle = null, this.registerTableOption("resizableRows", !1), this.registerTableOption("resizableRowGuide", !1);
  }
  initialize() {
    this.table.options.resizableRows && this.subscribe("row-layout-after", this.initializeRow.bind(this));
  }
  initializeRow(e) {
    var t = this, i = e.getElement(), s = document.createElement("div");
    s.className = "tabulator-row-resize-handle";
    var n = document.createElement("div");
    n.className = "tabulator-row-resize-handle prev", s.addEventListener("click", function(l) {
      l.stopPropagation();
    });
    var r = function(l) {
      t.startRow = e, t._mouseDown(l, e, s);
    };
    s.addEventListener("mousedown", r), s.addEventListener("touchstart", r, { passive: !0 }), n.addEventListener("click", function(l) {
      l.stopPropagation();
    });
    var a = function(l) {
      var h = t.table.rowManager.prevDisplayRow(e);
      h && (t.startRow = h, t._mouseDown(l, h, n));
    };
    n.addEventListener("mousedown", a), n.addEventListener("touchstart", a, { passive: !0 }), i.appendChild(s), i.appendChild(n);
  }
  resize(e, t) {
    t.setHeight(this.startHeight + ((typeof e.screenY > "u" ? e.touches[0].screenY : e.screenY) - this.startY));
  }
  calcGuidePosition(e, t, i) {
    var s = typeof e.screenY > "u" ? e.touches[0].screenY : e.screenY, n = i.getBoundingClientRect().y - this.table.element.getBoundingClientRect().y, r = this.table.element.getBoundingClientRect().y, a = t.element.getBoundingClientRect().top - r, l = s - this.startY;
    return Math.max(n + l, a);
  }
  _mouseDown(e, t, i) {
    var s = this, n;
    s.dispatchExternal("rowResizing", t.getComponent()), s.table.options.resizableRowGuide && (n = document.createElement("span"), n.classList.add("tabulator-row-resize-guide"), s.table.element.appendChild(n), setTimeout(() => {
      n.style.top = s.calcGuidePosition(e, t, i) + "px";
    })), s.table.element.classList.add("tabulator-block-select");
    function r(l) {
      s.table.options.resizableRowGuide ? n.style.top = s.calcGuidePosition(l, t, i) + "px" : s.resize(l, t);
    }
    function a(l) {
      s.table.options.resizableRowGuide && (s.resize(l, t), n.remove()), document.body.removeEventListener("mouseup", r), document.body.removeEventListener("mousemove", r), i.removeEventListener("touchmove", r), i.removeEventListener("touchend", a), s.table.element.classList.remove("tabulator-block-select"), s.dispatchExternal("rowResized", t.getComponent());
    }
    e.stopPropagation(), s.startY = typeof e.screenY > "u" ? e.touches[0].screenY : e.screenY, s.startHeight = t.getHeight(), document.body.addEventListener("mousemove", r), document.body.addEventListener("mouseup", a), i.addEventListener("touchmove", r, { passive: !0 }), i.addEventListener("touchend", a);
  }
}
R(as, "moduleName", "resizeRows");
class ls extends B {
  constructor(e) {
    super(e), this.binding = !1, this.visibilityObserver = !1, this.resizeObserver = !1, this.containerObserver = !1, this.tableHeight = 0, this.tableWidth = 0, this.containerHeight = 0, this.containerWidth = 0, this.autoResize = !1, this.visible = !1, this.initialized = !1, this.initialRedraw = !1, this.registerTableOption("autoResize", !0);
  }
  initialize() {
    if (this.table.options.autoResize) {
      var e = this.table, t;
      this.tableHeight = e.element.clientHeight, this.tableWidth = e.element.clientWidth, e.element.parentNode && (this.containerHeight = e.element.parentNode.clientHeight, this.containerWidth = e.element.parentNode.clientWidth), typeof IntersectionObserver < "u" && typeof ResizeObserver < "u" && e.rowManager.getRenderMode() === "virtual" ? (this.initializeVisibilityObserver(), this.autoResize = !0, this.resizeObserver = new ResizeObserver((i) => {
        var s = Math.floor(i[0].contentRect.height), n = Math.floor(i[0].contentRect.width);
        (this.tableHeight != s || this.tableWidth != n) && (this.tableHeight = s, this.tableWidth = n, e.element.parentNode && (this.containerHeight = e.element.parentNode.clientHeight, this.containerWidth = e.element.parentNode.clientWidth), this.redrawTable());
      }), this.resizeObserver.observe(e.element), t = window.getComputedStyle(e.element), this.table.element.parentNode && !this.table.rowManager.fixedHeight && (t.getPropertyValue("max-height") || t.getPropertyValue("min-height")) && (this.containerObserver = new ResizeObserver((i) => {
        var s = Math.floor(i[0].contentRect.height), n = Math.floor(i[0].contentRect.width);
        (this.containerHeight != s || this.containerWidth != n) && (this.containerHeight = s, this.containerWidth = n, this.tableHeight = e.element.clientHeight, this.tableWidth = e.element.clientWidth), this.redrawTable();
      }), this.containerObserver.observe(this.table.element.parentNode)), this.subscribe("table-resize", this.tableResized.bind(this))) : (this.binding = () => {
        e.columnManager.rerenderColumns(!0), e.redraw();
      }, window.addEventListener("resize", this.binding)), this.subscribe("table-destroy", this.clearBindings.bind(this));
    }
  }
  initializeVisibilityObserver() {
    this.visibilityObserver = new IntersectionObserver((e) => {
      this.visible = e[e.length - 1].isIntersecting, this.initialized ? this.visible && (this.redrawTable(this.initialRedraw), this.initialRedraw = !1) : (this.initialized = !0, this.initialRedraw = !this.visible);
    }), this.visibilityObserver.observe(this.table.element);
  }
  redrawTable(e) {
    this.initialized && this.visible && (this.table.columnManager.rerenderColumns(!0), this.table.redraw(e));
  }
  tableResized() {
    this.table.rowManager.redraw();
  }
  clearBindings() {
    this.binding && window.removeEventListener("resize", this.binding), this.resizeObserver && this.resizeObserver.unobserve(this.table.element), this.visibilityObserver && this.visibilityObserver.unobserve(this.table.element), this.containerObserver && this.containerObserver.unobserve(this.table.element.parentNode);
  }
}
R(ls, "moduleName", "resizeTable");
function pr(o, e, t) {
  var i = document.createElement("div"), s = o.getRow()._row.modules.responsiveLayout;
  i.classList.add("tabulator-responsive-collapse-toggle"), i.innerHTML = `<svg class='tabulator-responsive-collapse-toggle-open' viewbox="0 0 24 24">
  <line x1="7" y1="12" x2="17" y2="12" fill="none" stroke-width="3" stroke-linecap="round" />
  <line y1="7" x1="12" y2="17" x2="12" fill="none" stroke-width="3" stroke-linecap="round" />
</svg>

<svg class='tabulator-responsive-collapse-toggle-close' viewbox="0 0 24 24">
  <line x1="7" y1="12" x2="17" y2="12"  fill="none" stroke-width="3" stroke-linecap="round" />
</svg>`, o.getElement().classList.add("tabulator-row-handle");
  function n(r) {
    var a = s.element;
    s.open = r, a && (s.open ? (i.classList.add("open"), a.style.display = "") : (i.classList.remove("open"), a.style.display = "none"));
  }
  return i.addEventListener("click", function(r) {
    r.stopImmediatePropagation(), n(!s.open), o.getTable().rowManager.adjustTableSize();
  }), n(s.open), i;
}
var mr = {
  format: {
    formatters: {
      responsiveCollapse: pr
    }
  }
};
class hi extends B {
  constructor(e) {
    super(e), this.columns = [], this.hiddenColumns = [], this.mode = "", this.index = 0, this.collapseFormatter = [], this.collapseStartOpen = !0, this.collapseHandleColumn = !1, this.registerTableOption("responsiveLayout", !1), this.registerTableOption("responsiveLayoutCollapseStartOpen", !0), this.registerTableOption("responsiveLayoutCollapseUseFormatters", !0), this.registerTableOption("responsiveLayoutCollapseFormatter", !1), this.registerColumnOption("responsive");
  }
  //generate responsive columns list
  initialize() {
    this.table.options.responsiveLayout && (this.subscribe("column-layout", this.initializeColumn.bind(this)), this.subscribe("column-show", this.updateColumnVisibility.bind(this)), this.subscribe("column-hide", this.updateColumnVisibility.bind(this)), this.subscribe("columns-loaded", this.initializeResponsivity.bind(this)), this.subscribe("column-moved", this.initializeResponsivity.bind(this)), this.subscribe("column-add", this.initializeResponsivity.bind(this)), this.subscribe("column-delete", this.initializeResponsivity.bind(this)), this.subscribe("table-redrawing", this.tableRedraw.bind(this)), this.table.options.responsiveLayout === "collapse" && (this.subscribe("row-data-changed", this.generateCollapsedRowContent.bind(this)), this.subscribe("row-init", this.initializeRow.bind(this)), this.subscribe("row-layout", this.layoutRow.bind(this))));
  }
  tableRedraw(e) {
    ["fitColumns", "fitDataStretch"].indexOf(this.layoutMode()) === -1 && (e || this.update());
  }
  initializeResponsivity() {
    var e = [];
    this.mode = this.table.options.responsiveLayout, this.collapseFormatter = this.table.options.responsiveLayoutCollapseFormatter || this.formatCollapsedData, this.collapseStartOpen = this.table.options.responsiveLayoutCollapseStartOpen, this.hiddenColumns = [], this.collapseFormatter && (this.collapseFormatter = this.collapseFormatter.bind(this.table)), this.table.columnManager.columnsByIndex.forEach((t, i) => {
      t.modules.responsive && t.modules.responsive.order && t.modules.responsive.visible && (t.modules.responsive.index = i, e.push(t), !t.visible && this.mode === "collapse" && this.hiddenColumns.push(t));
    }), e = e.reverse(), e = e.sort((t, i) => {
      var s = i.modules.responsive.order - t.modules.responsive.order;
      return s || i.modules.responsive.index - t.modules.responsive.index;
    }), this.columns = e, this.mode === "collapse" && this.generateCollapsedContent();
    for (let t of this.table.columnManager.columnsByIndex)
      if (t.definition.formatter == "responsiveCollapse") {
        this.collapseHandleColumn = t;
        break;
      }
    this.collapseHandleColumn && (this.hiddenColumns.length ? this.collapseHandleColumn.show() : this.collapseHandleColumn.hide());
  }
  //define layout information
  initializeColumn(e) {
    var t = e.getDefinition();
    e.modules.responsive = { order: typeof t.responsive > "u" ? 1 : t.responsive, visible: t.visible !== !1 };
  }
  initializeRow(e) {
    var t;
    e.type !== "calc" && (t = document.createElement("div"), t.classList.add("tabulator-responsive-collapse"), e.modules.responsiveLayout = {
      element: t,
      open: this.collapseStartOpen
    }, this.collapseStartOpen || (t.style.display = "none"));
  }
  layoutRow(e) {
    var t = e.getElement();
    e.modules.responsiveLayout && (t.appendChild(e.modules.responsiveLayout.element), this.generateCollapsedRowContent(e));
  }
  //update column visibility
  updateColumnVisibility(e, t) {
    !t && e.modules.responsive && (e.modules.responsive.visible = e.visible, this.initializeResponsivity());
  }
  hideColumn(e) {
    var t = this.hiddenColumns.length;
    e.hide(!1, !0), this.mode === "collapse" && (this.hiddenColumns.unshift(e), this.generateCollapsedContent(), this.collapseHandleColumn && !t && this.collapseHandleColumn.show());
  }
  showColumn(e) {
    var t;
    e.show(!1, !0), e.setWidth(e.getWidth()), this.mode === "collapse" && (t = this.hiddenColumns.indexOf(e), t > -1 && this.hiddenColumns.splice(t, 1), this.generateCollapsedContent(), this.collapseHandleColumn && !this.hiddenColumns.length && this.collapseHandleColumn.hide());
  }
  //redraw columns to fit space
  update() {
    for (var e = !0; e; ) {
      let t = this.table.modules.layout.getMode() == "fitColumns" ? this.table.columnManager.getFlexBaseWidth() : this.table.columnManager.getWidth(), i = (this.table.options.headerVisible ? this.table.columnManager.element.clientWidth : this.table.element.clientWidth) - t;
      if (i < 0) {
        let s = this.columns[this.index];
        s ? (this.hideColumn(s), this.index++) : e = !1;
      } else {
        let s = this.columns[this.index - 1];
        s && i > 0 && i >= s.getWidth() ? (this.showColumn(s), this.index--) : e = !1;
      }
      this.table.rowManager.activeRowsCount || this.table.rowManager.renderEmptyScroll();
    }
  }
  generateCollapsedContent() {
    var e = this.table.rowManager.getDisplayRows();
    e.forEach((t) => {
      this.generateCollapsedRowContent(t);
    });
  }
  generateCollapsedRowContent(e) {
    var t, i;
    if (e.modules.responsiveLayout) {
      for (t = e.modules.responsiveLayout.element; t.firstChild; ) t.removeChild(t.firstChild);
      i = this.collapseFormatter(this.generateCollapsedRowData(e)), i && t.appendChild(i), e.calcHeight(!0);
    }
  }
  generateCollapsedRowData(e) {
    var t = e.getData(), i = [], s;
    return this.hiddenColumns.forEach((n) => {
      var r = n.getFieldValue(t);
      if (n.definition.title && n.field)
        if (n.modules.format && this.table.options.responsiveLayoutCollapseUseFormatters) {
          let l = function(h) {
            h();
          };
          var a = l;
          s = {
            value: !1,
            data: {},
            getValue: function() {
              return r;
            },
            getData: function() {
              return t;
            },
            getType: function() {
              return "cell";
            },
            getElement: function() {
              return document.createElement("div");
            },
            getRow: function() {
              return e.getComponent();
            },
            getColumn: function() {
              return n.getComponent();
            },
            getTable: () => this.table
          }, i.push({
            field: n.field,
            title: n.definition.title,
            value: n.modules.format.formatter.call(this.table.modules.format, s, n.modules.format.params, l)
          });
        } else
          i.push({
            field: n.field,
            title: n.definition.title,
            value: r
          });
    }), i;
  }
  formatCollapsedData(e) {
    var t = document.createElement("table");
    return e.forEach((i) => {
      var s = document.createElement("tr"), n = document.createElement("td"), r = document.createElement("td"), a, l = document.createElement("strong");
      n.appendChild(l), this.modules.localize.bind("columns|" + i.field, function(h) {
        l.innerHTML = h || i.title;
      }), i.value instanceof Node ? (a = document.createElement("div"), a.appendChild(i.value), r.appendChild(a)) : r.innerHTML = i.value, s.appendChild(n), s.appendChild(r), t.appendChild(s);
    }), Object.keys(e).length ? t : "";
  }
}
R(hi, "moduleName", "responsiveLayout"), R(hi, "moduleExtensions", mr);
function gr(o, e, t) {
  var i = document.createElement("input"), s = !1;
  if (i.type = "checkbox", i.setAttribute("aria-label", "Select Row"), this.table.modExists("selectRow", !0))
    if (i.addEventListener("click", (r) => {
      r.stopPropagation();
    }), typeof o.getRow == "function") {
      var n = o.getRow();
      n instanceof Tt ? (i.addEventListener("change", (r) => {
        this.table.options.selectableRowsRangeMode === "click" && s ? s = !1 : n.toggleSelect();
      }), this.table.options.selectableRowsRangeMode === "click" && i.addEventListener("click", (r) => {
        s = !0, this.table.modules.selectRow.handleComplexRowClick(n._row, r);
      }), i.checked = n.isSelected && n.isSelected(), this.table.modules.selectRow.registerRowSelectCheckbox(n, i)) : i = "";
    } else
      i.addEventListener("change", (r) => {
        this.table.modules.selectRow.selectedRows.length ? this.table.deselectRow() : this.table.selectRow(e.rowRange);
      }), this.table.modules.selectRow.registerHeaderSelectCheckbox(i);
  return i;
}
var br = {
  format: {
    formatters: {
      rowSelection: gr
    }
  }
};
class di extends B {
  constructor(e) {
    super(e), this.selecting = !1, this.lastClickedRow = !1, this.selectPrev = [], this.selectedRows = [], this.headerCheckboxElement = null, this.registerTableOption("selectableRows", "highlight"), this.registerTableOption("selectableRowsRangeMode", "drag"), this.registerTableOption("selectableRowsRollingSelection", !0), this.registerTableOption("selectableRowsPersistence", !0), this.registerTableOption("selectableRowsCheck", function(t, i) {
      return !0;
    }), this.registerTableFunction("selectRow", this.selectRows.bind(this)), this.registerTableFunction("deselectRow", this.deselectRows.bind(this)), this.registerTableFunction("toggleSelectRow", this.toggleRow.bind(this)), this.registerTableFunction("getSelectedRows", this.getSelectedRows.bind(this)), this.registerTableFunction("getSelectedData", this.getSelectedData.bind(this)), this.registerComponentFunction("row", "select", this.selectRows.bind(this)), this.registerComponentFunction("row", "deselect", this.deselectRows.bind(this)), this.registerComponentFunction("row", "toggleSelect", this.toggleRow.bind(this)), this.registerComponentFunction("row", "isSelected", this.isRowSelected.bind(this));
  }
  initialize() {
    this.deprecatedOptionsCheck(), this.table.options.selectableRows === "highlight" && this.table.options.selectableRange && (this.table.options.selectableRows = !1), this.table.options.selectableRows !== !1 && (this.subscribe("row-init", this.initializeRow.bind(this)), this.subscribe("row-deleting", this.rowDeleted.bind(this)), this.subscribe("rows-wipe", this.clearSelectionData.bind(this)), this.subscribe("rows-retrieve", this.rowRetrieve.bind(this)), this.table.options.selectableRows && !this.table.options.selectableRowsPersistence && this.subscribe("data-refreshing", this.deselectRows.bind(this)));
  }
  deprecatedOptionsCheck() {
  }
  rowRetrieve(e, t) {
    return e === "selected" ? this.selectedRows : t;
  }
  rowDeleted(e) {
    this._deselectRow(e, !0);
  }
  clearSelectionData(e) {
    var t = this.selectedRows.length;
    this.selecting = !1, this.lastClickedRow = !1, this.selectPrev = [], this.selectedRows = [], t && e !== !0 && this._rowSelectionChanged();
  }
  initializeRow(e) {
    var t = this, i = t.checkRowSelectability(e), s = e.getElement(), n = function() {
      setTimeout(function() {
        t.selecting = !1;
      }, 50), document.body.removeEventListener("mouseup", n);
    };
    e.modules.select = { selected: !1 }, s.classList.toggle("tabulator-selectable", i), s.classList.toggle("tabulator-unselectable", !i), t.checkRowSelectability(e) && t.table.options.selectableRows && t.table.options.selectableRows != "highlight" && (t.table.options.selectableRowsRangeMode === "click" ? s.addEventListener("click", this.handleComplexRowClick.bind(this, e)) : (s.addEventListener("click", function(r) {
      (!t.table.modExists("edit") || !t.table.modules.edit.getCurrentCell()) && t.table._clearSelection(), t.selecting || t.toggleRow(e);
    }), s.addEventListener("mousedown", function(r) {
      if (r.shiftKey)
        return t.table._clearSelection(), t.selecting = !0, t.selectPrev = [], document.body.addEventListener("mouseup", n), document.body.addEventListener("keyup", n), t.toggleRow(e), !1;
    }), s.addEventListener("mouseenter", function(r) {
      t.selecting && (t.table._clearSelection(), t.toggleRow(e), t.selectPrev[1] == e && t.toggleRow(t.selectPrev[0]));
    }), s.addEventListener("mouseout", function(r) {
      t.selecting && (t.table._clearSelection(), t.selectPrev.unshift(e));
    })));
  }
  handleComplexRowClick(e, t) {
    if (t.shiftKey) {
      this.table._clearSelection(), this.lastClickedRow = this.lastClickedRow || e;
      var i = this.table.rowManager.getDisplayRowIndex(this.lastClickedRow), s = this.table.rowManager.getDisplayRowIndex(e), n = i <= s ? i : s, r = i >= s ? i : s, a = this.table.rowManager.getDisplayRows().slice(0), l = a.splice(n, r - n + 1);
      t.ctrlKey || t.metaKey ? (l.forEach((h) => {
        h !== this.lastClickedRow && (this.table.options.selectableRows !== !0 && !this.isRowSelected(e) ? this.selectedRows.length < this.table.options.selectableRows && this.toggleRow(h) : this.toggleRow(h));
      }), this.lastClickedRow = e) : (this.deselectRows(void 0, !0), this.table.options.selectableRows !== !0 && l.length > this.table.options.selectableRows && (l = l.slice(0, this.table.options.selectableRows)), this.selectRows(l)), this.table._clearSelection();
    } else t.ctrlKey || t.metaKey ? (this.toggleRow(e), this.lastClickedRow = e) : (this.deselectRows(void 0, !0), this.selectedRows.length === 1 && this.isRowSelected(e) || this.selectRows(e), this.lastClickedRow = e);
  }
  checkRowSelectability(e) {
    return e && e.type === "row" ? this.table.options.selectableRowsCheck.call(this.table, e.getComponent()) : !1;
  }
  //toggle row selection
  toggleRow(e) {
    this.checkRowSelectability(e) && (e.modules.select && e.modules.select.selected ? this._deselectRow(e) : this._selectRow(e));
  }
  //select a number of rows
  selectRows(e) {
    var t = [], i, s;
    switch (typeof e) {
      case "undefined":
        i = this.table.rowManager.rows;
        break;
      case "number":
        i = this.table.rowManager.findRow(e);
        break;
      case "string":
        i = this.table.rowManager.findRow(e), i || (i = this.table.rowManager.getRows(e));
        break;
      default:
        i = e;
        break;
    }
    Array.isArray(i) ? i.length && (i.forEach((n) => {
      s = this._selectRow(n, !0), s && t.push(s);
    }), this._rowSelectionChanged(!1, t)) : i && this._selectRow(i, !1);
  }
  //select an individual row
  _selectRow(e, t, i) {
    if (!isNaN(this.table.options.selectableRows) && this.table.options.selectableRows !== !0 && !i && this.selectedRows.length >= this.table.options.selectableRows)
      if (this.table.options.selectableRowsRollingSelection)
        this._deselectRow(this.selectedRows[0]);
      else
        return !1;
    var s = this.table.rowManager.findRow(e);
    if (s) {
      if (this.selectedRows.indexOf(s) == -1)
        return s.getElement().classList.add("tabulator-selected"), s.modules.select || (s.modules.select = {}), s.modules.select.selected = !0, s.modules.select.checkboxEl && (s.modules.select.checkboxEl.checked = !0), this.selectedRows.push(s), this.table.options.dataTreeSelectPropagate && this.childRowSelection(s, !0), this.dispatchExternal("rowSelected", s.getComponent()), this._rowSelectionChanged(t, s), s;
    } else
      t || console.warn("Selection Error - No such row found, ignoring selection:" + e);
  }
  isRowSelected(e) {
    return this.selectedRows.indexOf(e) !== -1;
  }
  //deselect a number of rows
  deselectRows(e, t) {
    var i = [], s, n;
    switch (typeof e) {
      case "undefined":
        s = Object.assign([], this.selectedRows);
        break;
      case "number":
        s = this.table.rowManager.findRow(e);
        break;
      case "string":
        s = this.table.rowManager.findRow(e), s || (s = this.table.rowManager.getRows(e));
        break;
      default:
        s = e;
        break;
    }
    Array.isArray(s) ? s.length && (s.forEach((r) => {
      n = this._deselectRow(r, !0, !0), n && i.push(n);
    }), this._rowSelectionChanged(t, [], i)) : s && this._deselectRow(s, t, !0);
  }
  //deselect an individual row
  _deselectRow(e, t) {
    var i = this, s = i.table.rowManager.findRow(e), n, r;
    if (s) {
      if (n = i.selectedRows.findIndex(function(a) {
        return a == s;
      }), n > -1)
        return r = s.getElement(), r && r.classList.remove("tabulator-selected"), s.modules.select || (s.modules.select = {}), s.modules.select.selected = !1, s.modules.select.checkboxEl && (s.modules.select.checkboxEl.checked = !1), i.selectedRows.splice(n, 1), this.table.options.dataTreeSelectPropagate && this.childRowSelection(s, !1), this.dispatchExternal("rowDeselected", s.getComponent()), i._rowSelectionChanged(t, void 0, s), s;
    } else
      t || console.warn("Deselection Error - No such row found, ignoring selection:" + e);
  }
  getSelectedData() {
    var e = [];
    return this.selectedRows.forEach(function(t) {
      e.push(t.getData());
    }), e;
  }
  getSelectedRows() {
    var e = [];
    return this.selectedRows.forEach(function(t) {
      e.push(t.getComponent());
    }), e;
  }
  _rowSelectionChanged(e, t = [], i = []) {
    this.headerCheckboxElement && (this.selectedRows.length === 0 ? (this.headerCheckboxElement.checked = !1, this.headerCheckboxElement.indeterminate = !1) : this.table.rowManager.rows.length === this.selectedRows.length ? (this.headerCheckboxElement.checked = !0, this.headerCheckboxElement.indeterminate = !1) : (this.headerCheckboxElement.indeterminate = !0, this.headerCheckboxElement.checked = !1)), e || (Array.isArray(t) || (t = [t]), t = t.map((s) => s.getComponent()), Array.isArray(i) || (i = [i]), i = i.map((s) => s.getComponent()), this.dispatchExternal("rowSelectionChanged", this.getSelectedData(), this.getSelectedRows(), t, i));
  }
  registerRowSelectCheckbox(e, t) {
    e._row.modules.select || (e._row.modules.select = {}), e._row.modules.select.checkboxEl = t;
  }
  registerHeaderSelectCheckbox(e) {
    this.headerCheckboxElement = e;
  }
  childRowSelection(e, t) {
    var i = this.table.modules.dataTree.getChildren(e, !0, !0);
    if (t)
      for (let s of i)
        this._selectRow(s, !0);
    else
      for (let s of i)
        this._deselectRow(s, !0);
  }
}
R(di, "moduleName", "selectRow"), R(di, "moduleExtensions", br);
class vr {
  constructor(e) {
    return this._range = e, new Proxy(this, {
      get: function(t, i, s) {
        return typeof t[i] < "u" ? t[i] : t._range.table.componentFunctionBinder.handle("range", t._range, i);
      }
    });
  }
  getElement() {
    return this._range.element;
  }
  getData() {
    return this._range.getData();
  }
  getCells() {
    return this._range.getCells(!0, !0);
  }
  getModifiedCells() {
    return this._range.modifiedCells;
  }
  getStructuredCells() {
    return this._range.getStructuredCells();
  }
  getRows() {
    return this._range.getRows().map((e) => e.getComponent());
  }
  getColumns() {
    return this._range.getColumns().map((e) => e.getComponent());
  }
  getBounds() {
    return this._range.getBounds();
  }
  getTopEdge() {
    return this._range.rect.top;
  }
  getBottomEdge() {
    return this._range.rect.bottom;
  }
  getLeftEdge() {
    return this._range.rect.left;
  }
  getRightEdge() {
    return this._range.rect.right;
  }
  setBounds(e, t) {
    this._range.destroyedGuard("setBounds") && this._range.setBounds(e && e._cell, t && t._cell);
  }
  setStartBound(e) {
    this._range.destroyedGuard("setStartBound") && (this._range.setEndBound(e && e._cell), this._range.rangeManager.layoutElement());
  }
  setEndBound(e) {
    this._range.destroyedGuard("setEndBound") && (this._range.setEndBound(e && e._cell), this._range.rangeManager.layoutElement());
  }
  clearValues() {
    this._range.destroyedGuard("clearValues") && this._range.clearValues();
  }
  setData(e) {
    this._range.destroyedGuard("setData") && this._range.setData(e);
  }
  fill(e) {
    this._range.destroyedGuard("fill") && this._range.fill(e);
  }
  remove() {
    this._range.destroyedGuard("remove") && this._range.destroy(!0);
  }
}
class ut {
  constructor(e, t, i, s) {
    this.top = e, this.bottom = t, this.left = i, this.right = s;
  }
  static zero() {
    return new ut(0, 0, 0, 0);
  }
  clone() {
    return new ut(this.top, this.bottom, this.left, this.right);
  }
  /**
   * Check if this rect and other are equal
   * @param {Rect} other
   */
  equals(e) {
    return this.top === e.top && this.bottom === e.bottom && this.left === e.left && this.right === e.right;
  }
  /**
   * @param {number} x
   * @param {number} y
   */
  hasPoint(e, t) {
    return e >= this.left && e <= this.right && t >= this.top && t <= this.bottom;
  }
  /**
   * Executes a provided function once for each point in the rectangle
   * @param {(x: number, y: number) => void} fn
   */
  forEach(e) {
    for (let t = this.top; t <= this.bottom; t++)
      for (let i = this.left; i <= this.right; i++)
        e(i, t);
  }
}
class hs extends ie {
  /**
   * @param {{start?: Cell|Column, end?: Cell|Column, rect?: Rect, skipEvents?: boolean, classNames?: string[]}} options
   */
  constructor(e, t, i) {
    super(e), this.rangeManager = t, this.element = null, this.initialized = !1, this.initializing = {
      start: !1,
      end: !1
    }, this.destroyed = !1, this.skipEvents = i.skipEvents || !1, this.rect = i.rect ? i.rect.clone() : ut.zero(), this.table = e, this.modifiedCells = [], this.start = { row: void 0, col: void 0 }, this.end = { row: void 0, col: void 0 }, i.rect ? (this.start.row = i.rect.top, this.start.col = i.rect.left, this.end.row = i.rect.bottom, this.end.col = i.rect.right) : this.rangeManager.rowHeader && (this.rect.left = 1, this.rect.right = 1, this.start.col = 1, this.end.col = 1), this.initElement(i.classNames), i.rect || setTimeout(() => {
      this.initBounds(i.start, i.end);
    });
  }
  initElement(e) {
    this.element = document.createElement("div"), this.element.classList.add("tabulator-range"), e && this.element.classList.add(...e);
  }
  initBounds(e, t) {
    this._updateMinMax(), e && this.setBounds(e, t || e);
  }
  ///////////////////////////////////
  ///////   Boundary Setup    ///////
  ///////////////////////////////////
  setStart(e, t) {
    (this.start.row !== e || this.start.col !== t) && (this.start.row = e, this.start.col = t, this.initializing.start = !0, this._updateMinMax());
  }
  setEnd(e, t) {
    (this.end.row !== e || this.end.col !== t) && (this.end.row = e, this.end.col = t, this.initializing.end = !0, this._updateMinMax());
  }
  /**
   * @param {Rect} rect
   */
  setRect(e) {
    const t = this.start.row === this.rect.top ? e.top : e.bottom, i = this.start.col === this.rect.left ? e.left : e.right;
    this.setStart(t, i), this.setEnd(
      t === e.top ? e.bottom : e.top,
      i === e.left ? e.right : e.left
    );
  }
  setBounds(e, t, i) {
    e && this.setStartBound(e), this.setEndBound(t || e), this.rangeManager.layoutElement(i);
  }
  setStartBound(e) {
    var t, i;
    e.type === "column" ? this.rangeManager.columnSelection && this.setStart(0, e.getPosition() - 1) : (t = e.row.position - 1, i = e.column.getPosition() - 1, e.column === this.rangeManager.rowHeader ? this.setStart(t, 1) : this.setStart(t, i));
  }
  setEndBound(e) {
    var t = this._getTableRows().length, i, s, n;
    e.type === "column" ? this.rangeManager.columnSelection && (this.rangeManager.selecting === "column" ? this.setEnd(t - 1, e.getPosition() - 1) : this.rangeManager.selecting === "cell" && this.setEnd(0, e.getPosition() - 1)) : (i = e.row.position - 1, s = e.column.getPosition() - 1, n = e.column === this.rangeManager.rowHeader, this.rangeManager.selecting === "row" ? this.setEnd(i, this._getTableColumns().length - 1) : this.rangeManager.selecting !== "row" && n ? this.setEnd(i, 0) : this.rangeManager.selecting === "column" ? this.setEnd(t - 1, s) : this.setEnd(i, s));
  }
  _updateMinMax() {
    this.rect.top = Math.min(this.start.row, this.end.row), this.rect.bottom = Math.max(this.start.row, this.end.row), this.rect.left = Math.min(this.start.col, this.end.col), this.rect.right = Math.max(this.start.col, this.end.col), this.initialized ? this.skipEvents || this.dispatchExternal("rangeChanged", this.getComponent()) : this.initializing.start && this.initializing.end && (this.initialized = !0, this.skipEvents || (this.dispatch("range-added", this), this.dispatchExternal("rangeAdded", this.getComponent())));
  }
  _getTableColumns() {
    return this.table.columnManager.getVisibleColumnsByIndex();
  }
  _getTableRows() {
    return this.table.rowManager.getDisplayRows().filter((e) => e.type === "row");
  }
  ///////////////////////////////////
  ///////      Rendering      ///////
  ///////////////////////////////////
  layout() {
    var e = this.table.rowManager.renderer.vDomTop, t = this.table.rowManager.renderer.vDomBottom, i = this.table.columnManager.renderer.leftCol, s = this.table.columnManager.renderer.rightCol, n = this.table.modules.frozenColumns.leftColumns, r = n.length, a = this.table.modules.frozenColumns.rightColumns, l = a.length, h, d, c, u, f, m, p, v, b, k;
    if (this.table.options.renderHorizontal === "virtual" && this.rangeManager.rowHeader && (s += 1), e == null && (e = 0), t == null && (t = 1 / 0), i == null && (i = 0), s == null && (s = 1 / 0), r > 0 && n[0].isRowHeader === !0 && (r -= 1), this.overlaps(i, e, s, t)) {
      h = Math.max(this.rect.top, e), d = Math.min(this.rect.bottom, t), c = Math.max(this.rect.left, i), u = Math.min(this.rect.right, s + r + l), f = this.rangeManager.getCell(h, c), m = this.rangeManager.getCell(d, u), p = f.getElement(), v = m.getElement(), b = f.row.getElement(), k = m.row.getElement(), this.element.classList.add("tabulator-range-active");
      let S = 0;
      if (this.rangeManager.getTableColumns().forEach((F) => {
        this.occupiesColumn(F) && F.definition.frozen && (S += F.width);
      }), this.table.rtl) {
        const F = Math.max(
          p.offsetLeft + p.offsetWidth - v.offsetLeft,
          S
        );
        this.element.style.right = b.offsetWidth - p.offsetLeft - p.offsetWidth + "px", this.element.style.width = F + "px";
      } else {
        const F = Math.max(
          v.offsetLeft + v.offsetWidth - p.offsetLeft,
          S
        );
        this.element.style.left = b.offsetLeft + p.offsetLeft + "px", this.element.style.width = F + "px";
      }
      this.element.style.top = b.offsetTop + "px", this.element.style.height = k.offsetTop + k.offsetHeight - b.offsetTop + "px";
    }
  }
  atTopLeft(e) {
    return e.row.position - 1 === this.rect.top && e.column.getPosition() - 1 === this.rect.left;
  }
  atBottomRight(e) {
    return e.row.position - 1 === this.rect.bottom && e.column.getPosition() - 1 === this.rect.right;
  }
  occupies(e) {
    return this.occupiesRow(e.row) && this.occupiesColumn(e.column);
  }
  occupiesRow(e) {
    return this.rect.top <= e.position - 1 && e.position - 1 <= this.rect.bottom;
  }
  occupiesColumn(e) {
    return this.rect.left <= e.getPosition() - 1 && e.getPosition() - 1 <= this.rect.right;
  }
  overlaps(e, t, i, s) {
    return !(this.rect.left > i || e > this.rect.right || this.rect.top > s || t > this.rect.bottom);
  }
  getData() {
    var e = [], t = this.getRows(), i = this.getColumns();
    return t.forEach((s) => {
      var n = s.getData(), r = {};
      i.forEach((a) => {
        r[a.field] = n[a.field];
      }), e.push(r);
    }), e;
  }
  getCells(e, t) {
    var i = [], s = this.getRows(), n = this.getColumns();
    return e ? i = s.map((r) => {
      var a = [];
      return r.getCells().forEach((l) => {
        n.includes(l.column) && a.push(t ? l.getComponent() : l);
      }), a;
    }) : s.forEach((r) => {
      r.getCells().forEach((a) => {
        n.includes(a.column) && i.push(t ? a.getComponent() : a);
      });
    }), i;
  }
  getStructuredCells() {
    return this.getCells(!0, !0);
  }
  getRows() {
    return this._getTableRows().slice(this.rect.top, this.rect.bottom + 1);
  }
  getColumns() {
    return this._getTableColumns().slice(this.rect.left, this.rect.right + 1);
  }
  clearValues() {
    var e = this.getCells(), t = this.table.options.selectableRangeClearCellsValue;
    this.table.blockRedraw(), e.forEach((i) => {
      i.setValue(t);
    }), this.table.restoreRedraw();
  }
  setData(e) {
    const t = this.getCells(!0), i = /* @__PURE__ */ new Map(), s = [];
    let n = !1;
    this.modifiedCells = [], this.table.blockRedraw(), t.forEach((r, a) => {
      const l = e[a];
      r.forEach((h, d) => {
        const c = h.column.getField(), u = h.getValue(), f = !this.table.modExists("edit") || this.table.modules.edit.allowEdit(h);
        let m = u;
        f && c && d < l.length && (m = l[d], u !== m && (n = !0, this.modifiedCells.push(h.getComponent())), i.has(h.row) || i.set(h.row, {}), i.get(h.row)[c] = m), s.push({ oldValue: u, newValue: m });
      });
    }), i.forEach((r, a) => a.updateData(r)), n && this.table.modExists("history") && this.table.modules.history.action("rangeEdit", this, {
      cells: s
    }), n && this.dispatchExternal("rangeEdited", this.getComponent()), this.table.restoreRedraw();
  }
  fill(e) {
    const t = this.getColumns(), i = this.getRows().map(() => t.map(() => e));
    this.setData(i);
  }
  getBounds(e) {
    var t = this.getCells(!1, e), i = {
      start: null,
      end: null
    };
    return t.length ? (i.start = t[0], i.end = t[t.length - 1]) : console.warn("No bounds defined on range"), i;
  }
  getStartCell() {
    return this.rangeManager.getCell(this.start.row, this.start.col);
  }
  getEndCell() {
    return this.rangeManager.getCell(this.end.row, this.end.col);
  }
  getComponent() {
    return this.component || (this.component = new vr(this)), this.component;
  }
  destroy(e) {
    this.destroyed = !0, this.element.remove(), e && this.rangeManager.rangeRemoved(this), this.initialized && !this.skipEvents && this.dispatchExternal("rangeRemoved", this.getComponent());
  }
  destroyedGuard(e) {
    return this.destroyed && console.warn("You cannot call the " + e + " function on a destroyed range"), !this.destroyed;
  }
}
class yt extends ie {
  constructor(e, t) {
    super(e), this.rangeManager = t, this.element = null, this.preview = null, this.source = null, this.pointerRow = 0, this.pointerCol = 0, this.isActive = !1, this.handleMouseDown = this.handleMouseDown.bind(this), this.handleMouseUp = this.handleMouseUp.bind(this), this.handleCellMouseMove = this.handleCellMouseMove.bind(this), this.element = document.createElement("div"), this.element.classList.add("tabulator-range-fill-handle"), this.element.addEventListener("mousedown", this.handleMouseDown), this.subscribe("range-active-changed", (i) => this.attach(i));
  }
  attach(e) {
    this.element.parentNode !== e.element && e.element.appendChild(this.element);
  }
  handleMouseDown(e) {
    const t = this.rangeManager.activeRange;
    e.button !== 0 || !t || (e.preventDefault(), e.stopPropagation(), this.isActive = !0, this.source = t.rect.clone(), this.pointerRow = this.source.bottom, this.pointerCol = this.source.right, this.preview = new hs(this.table, this.rangeManager, {
      rect: this.source,
      skipEvents: !0,
      classNames: ["tabulator-range-fill-preview"]
    }), this.rangeManager.rangeContainer.appendChild(this.preview.element), this.preview.layout(), this.subscribe("cell-mousemove", this.handleCellMouseMove), document.addEventListener("mouseup", this.handleMouseUp));
  }
  handleCellMouseMove(e, t) {
    if (t.column === this.rangeManager.rowHeader)
      return;
    const i = t.row.position - 1, s = t.column.getPosition() - 1;
    if (i === this.pointerRow && s === this.pointerCol)
      return;
    this.pointerRow = i, this.pointerCol = s;
    const n = yt.extendAlongAxis(
      this.source,
      this.pointerRow,
      this.pointerCol
    );
    this.preview.setRect(n), this.preview.layout();
  }
  async handleMouseUp() {
    this.isActive = !1, this.unsubscribe("cell-mousemove", this.handleCellMouseMove), document.removeEventListener("mouseup", this.handleMouseUp), this.rangeManager.clearRanges();
    const e = await this.addInitializedRange(
      this.preview.getStartCell(),
      this.preview.getEndCell()
    ), t = this.buildFillData(
      this.source,
      this.pointerRow,
      this.pointerCol
    );
    e.setData(t), this.preview.destroy();
  }
  /**
   * The data, in Range.setData shape, for the cells a drag from `source` to
   * (pointerRow, pointerCol) covers, repeating the source's values.
   * @param {Rect} source
   * @param {number} pointerRow
   * @param {number} pointerCol
   */
  buildFillData(e, t, i) {
    const s = yt.extendAlongAxis(e, t, i), n = e.bottom - e.top + 1, r = e.right - e.left + 1, a = this.rangeManager.getTableRows(), l = this.rangeManager.getTableColumns(), h = [];
    for (let d = s.top; d <= s.bottom; d++) {
      const c = [];
      for (let u = s.left; u <= s.right; u++) {
        const f = e.top + ((d - e.top) % n + n) % n, m = e.left + ((u - e.left) % r + r) % r, p = a[f], v = l[m];
        c.push(p.getData()[v.getField()]);
      }
      h.push(c);
    }
    return h;
  }
  addInitializedRange(e, t) {
    const i = this.rangeManager.addRange(e, t);
    return i.initialized ? Promise.resolve(i) : new Promise((s) => {
      const n = (r) => {
        r === i && (this.unsubscribe("range-added", n), s(i));
      };
      this.subscribe("range-added", n);
    });
  }
  /**
   * The rect a fill from `source` covers when the pointer is over (row, col).
   * @param {Rect} source
   * @param {number} row
   * @param {number} col
   */
  static extendAlongAxis(e, t, i) {
    let s = 0, n = 0, r = e.top, a = e.bottom, l = e.left, h = e.right;
    return t < e.top ? s = e.top - t : t > e.bottom && (s = t - e.bottom), i < e.left ? n = e.left - i : i > e.right && (n = i - e.right), s && s >= n ? (r = Math.min(r, t), a = Math.max(a, t)) : n && (l = Math.min(l, i), h = Math.max(h, i)), new ut(r, a, l, h);
  }
  destroy() {
    var e;
    document.removeEventListener("mouseup", this.handleMouseUp), this.element.remove(), (e = this.preview) == null || e.destroy();
  }
}
var wr = {
  rangeJumpUp: ["ctrl + 38", "meta + 38"],
  rangeJumpDown: ["ctrl + 40", "meta + 40"],
  rangeJumpLeft: ["ctrl + 37", "meta + 37"],
  rangeJumpRight: ["ctrl + 39", "meta + 39"],
  rangeExpandUp: "shift + 38",
  rangeExpandDown: "shift + 40",
  rangeExpandLeft: "shift + 37",
  rangeExpandRight: "shift + 39",
  rangeExpandJumpUp: ["ctrl + shift + 38", "meta + shift + 38"],
  rangeExpandJumpDown: ["ctrl + shift + 40", "meta + shift + 40"],
  rangeExpandJumpLeft: ["ctrl + shift + 37", "meta + shift + 37"],
  rangeExpandJumpRight: ["ctrl + shift + 39", "meta + shift + 39"]
}, Cr = {
  rangeJumpLeft: function(o) {
    this.dispatch("keybinding-nav-range", o, "left", !0, !1);
  },
  rangeJumpRight: function(o) {
    this.dispatch("keybinding-nav-range", o, "right", !0, !1);
  },
  rangeJumpUp: function(o) {
    this.dispatch("keybinding-nav-range", o, "up", !0, !1);
  },
  rangeJumpDown: function(o) {
    this.dispatch("keybinding-nav-range", o, "down", !0, !1);
  },
  rangeExpandLeft: function(o) {
    this.dispatch("keybinding-nav-range", o, "left", !1, !0);
  },
  rangeExpandRight: function(o) {
    this.dispatch("keybinding-nav-range", o, "right", !1, !0);
  },
  rangeExpandUp: function(o) {
    this.dispatch("keybinding-nav-range", o, "up", !1, !0);
  },
  rangeExpandDown: function(o) {
    this.dispatch("keybinding-nav-range", o, "down", !1, !0);
  },
  rangeExpandJumpLeft: function(o) {
    this.dispatch("keybinding-nav-range", o, "left", !0, !0);
  },
  rangeExpandJumpRight: function(o) {
    this.dispatch("keybinding-nav-range", o, "right", !0, !0);
  },
  rangeExpandJumpUp: function(o) {
    this.dispatch("keybinding-nav-range", o, "up", !0, !0);
  },
  rangeExpandJumpDown: function(o) {
    this.dispatch("keybinding-nav-range", o, "down", !0, !0);
  }
}, Er = {
  range: function(o) {
    var e = [], t = this.table.modules.selectRange.activeRange, i = !1, s, n, r, a, l;
    return l = o.length, t && (s = t.getBounds(), n = s.start, s.start === s.end && (i = !0), n && (e = this.table.rowManager.activeRows.slice(), r = e.indexOf(n.row), i ? a = o.length : a = e.indexOf(s.end.row) - r + 1, r > -1 && (this.table.blockRedraw(), e = e.slice(r, r + a), e.forEach((h, d) => {
      h.updateData(o[d % l]);
    }), this.table.restoreRedraw()))), e;
  }
}, yr = {
  range: function(o) {
    var e = [], t = [], i = this.table.modules.selectRange.activeRange, s = !1, n, r, a, l, h;
    return i && (n = i.getBounds(), r = n.start, n.start === n.end && (s = !0), r && (o = o.split(`
`), o.forEach(function(d) {
      e.push(d.split("	"));
    }), e.length && (l = this.table.columnManager.getVisibleColumnsByIndex(), h = l.indexOf(r.column), h > -1))) ? (s ? a = e[0].length : a = l.indexOf(n.end.column) - h + 1, l = l.slice(h, h + a), e.forEach((d) => {
      var c = {}, u = d.length;
      l.forEach(function(f, m) {
        c[f.field] = d[m % u];
      }), t.push(c);
    }), t) : !1;
  }
}, Rr = {
  range: function() {
    var o = this.modules.selectRange.selectedColumns();
    return this.columnManager.rowHeader && o.unshift(this.columnManager.rowHeader), o;
  }
}, xr = {
  range: function() {
    return this.modules.selectRange.selectedRows();
  }
}, kr = {
  rangeEdit: function(o) {
    o.component.getCells().forEach((e, t) => {
      e.setValueProcessData(o.data.cells[t].oldValue), e.cellRendered();
    });
  }
}, Tr = {
  rangeEdit: function(o) {
    o.component.getCells().forEach((e, t) => {
      e.setValueProcessData(o.data.cells[t].newValue), e.cellRendered();
    });
  }
}, Mr = {
  keybindings: {
    bindings: wr,
    actions: Cr
  },
  clipboard: {
    pasteActions: Er,
    pasteParsers: yr
  },
  export: {
    columnLookups: Rr,
    rowLookups: xr
  },
  history: {
    undoers: kr,
    redoers: Tr
  }
};
class wt extends B {
  constructor(e) {
    super(e), this.selecting = "cell", this.mousedown = !1, this.ranges = [], this.overlay = null, this.rowHeader = null, this.layoutChangeTimeout = null, this.columnSelection = !1, this.rowSelection = !1, this.maxRanges = 0, this.activeRange = !1, this.blockKeydown = !1, this.tabAnchorCol = null, this.fillHandle = null, this.keyDownEvent = this._handleKeyDown.bind(this), this.editKeyDownEvent = this._handleEditKeyDown.bind(this), this.mouseUpEvent = this._handleMouseUp.bind(this), this.registerTableOption("selectableRange", !1), this.registerTableOption("selectableRangeColumns", !1), this.registerTableOption("selectableRangeRows", !1), this.registerTableOption("selectableRangeClearCells", !1), this.registerTableOption("selectableRangeClearCellsValue", void 0), this.registerTableOption("selectableRangeAutoFocus", !0), this.registerTableOption("selectableRangeInitializeDefault", !0), this.registerTableOption("selectableRangeBlurEditOnNavigate", void 0), this.registerTableOption("selectableRangeCommitEditOnNavigate", !1), this.registerTableOption("selectableRangeFill", !1), this.registerTableFunction("getRangesData", this.getRangesData.bind(this)), this.registerTableFunction("getRanges", this.getRanges.bind(this)), this.registerTableFunction("addRange", this.addRangeFromComponent.bind(this)), this.registerComponentFunction("cell", "getRanges", this.cellGetRanges.bind(this)), this.registerComponentFunction("row", "getRanges", this.rowGetRanges.bind(this)), this.registerComponentFunction("column", "getRanges", this.colGetRanges.bind(this));
  }
  ///////////////////////////////////
  ///////    Initialization   ///////
  ///////////////////////////////////
  initialize() {
    this.options("selectableRange") && (this.options("selectableRows") ? console.warn("SelectRange functionality cannot be used in conjunction with row selection") : (this.maxRanges = this.options("selectableRange"), this.initializeTable(), this.initializeWatchers()), this.options("columns").findIndex((e) => e.frozen) > 0 && console.warn("Having frozen column in arbitrary position with selectRange option may result in unpredictable behavior."), this.options("columns").filter((e) => e.frozen) > 1 && console.warn("Having multiple frozen columns with selectRange option may result in unpredictable behavior.")), this.subscribe("edit-nav-disabled", () => !0);
  }
  initializeTable() {
    this.overlay = document.createElement("div"), this.overlay.classList.add("tabulator-range-overlay"), this.rangeContainer = document.createElement("div"), this.rangeContainer.classList.add("tabulator-range-container"), this.activeRangeCellElement = document.createElement("div"), this.activeRangeCellElement.classList.add("tabulator-range-cell-active"), this.overlay.appendChild(this.rangeContainer), this.overlay.appendChild(this.activeRangeCellElement), this.options("selectableRangeFill") && (this.fillHandle = new yt(this.table, this)), this.table.rowManager.element.addEventListener("keydown", this.keyDownEvent), this.setDefaultRange(), this.table.rowManager.element.appendChild(this.overlay), this.table.columnManager.element.setAttribute("tabindex", 0), this.table.element.classList.add("tabulator-ranges");
  }
  initializeWatchers() {
    this.columnSelection = this.options("selectableRangeColumns"), this.rowSelection = this.options("selectableRangeRows"), this.subscribe("column-init", this.initializeColumn.bind(this)), this.subscribe("column-mousedown", this.handleColumnMouseDown.bind(this)), this.subscribe("column-mousemove", this.handleColumnMouseMove.bind(this)), this.subscribe("column-resized", this.handleColumnResized.bind(this)), this.subscribe("column-moving", this.handleColumnMoving.bind(this)), this.subscribe("column-moved", this.handleColumnMoved.bind(this)), this.subscribe("column-width", this.layoutChange.bind(this)), this.subscribe("column-height", this.layoutChange.bind(this)), this.subscribe("column-resized", this.layoutChange.bind(this)), this.subscribe("columns-loaded", this.updateHeaderColumn.bind(this)), this.subscribe("cell-height", this.layoutChange.bind(this)), this.subscribe("cell-rendered", this.renderCell.bind(this)), this.subscribe("cell-mousedown", this.handleCellMouseDown.bind(this)), this.subscribe("cell-mousemove", this.handleCellMouseMove.bind(this)), this.subscribe("cell-click", this.handleCellClick.bind(this)), this.subscribe("cell-editing", this.handleEditingCell.bind(this)), this.subscribe("page-changed", this.redraw.bind(this)), this.subscribe("scroll-vertical", this.layoutChange.bind(this)), this.subscribe("scroll-horizontal", this.layoutChange.bind(this)), this.subscribe("data-destroy", this.tableDestroyed.bind(this)), this.subscribe("data-processed", this.setDefaultRange.bind(this)), this.subscribe("table-layout", this.layoutElement.bind(this)), this.subscribe("table-redraw", this.redraw.bind(this)), this.subscribe("table-destroy", this.tableDestroyed.bind(this)), this.subscribe("edit-editor-created", this.handleEditorCreated.bind(this)), this.subscribe("edit-editor-clear", this.finishEditingCell.bind(this)), this.subscribe("edit-blur", this.restoreFocus.bind(this)), this.subscribe("keybinding-nav-prev", this.keyNavigate.bind(this, "prev"), 20), this.subscribe("keybinding-nav-next", this.setTabAnchor.bind(this), 10), this.subscribe("keybinding-nav-next", this.keyNavigate.bind(this, "next"), 20), this.subscribe("keybinding-nav-left", this.keyNavigate.bind(this, "left")), this.subscribe("keybinding-nav-right", this.keyNavigate.bind(this, "right")), this.subscribe("keybinding-nav-up", this.keyNavigate.bind(this, "up")), this.subscribe("keybinding-nav-down", this.keyNavigate.bind(this, "down")), this.subscribe("keybinding-nav-range", this.keyNavigateRange.bind(this));
  }
  initializeColumn(e) {
    this.columnSelection && e.definition.headerSort && this.options("headerSortClickElement") !== "icon" && console.warn("Using column headerSort with selectableRangeColumns option may result in unpredictable behavior. Consider using headerSortClickElement: 'icon'.");
  }
  updateHeaderColumn() {
    var e;
    this.rowSelection && (this.rowHeader = this.table.columnManager.getVisibleColumnsByIndex()[0], this.rowHeader && (this.rowHeader.definition.cssClass = this.rowHeader.definition.cssClass + " tabulator-range-row-header", this.rowHeader.definition.headerSort && console.warn("Using column headerSort with selectableRangeRows option may result in unpredictable behavior"), this.rowHeader.definition.editor && console.warn("Using column editor with selectableRangeRows option may result in unpredictable behavior"))), this.table.modules.frozenColumns && this.table.modules.frozenColumns.active && (e = this.table.modules.frozenColumns.getFrozenColumns(), (e.length > 1 || e.length === 1 && e[0] !== this.rowHeader) && console.warn("Using frozen columns that are not the range header in combination with the selectRange option may result in unpredictable behavior"));
  }
  ///////////////////////////////////
  ///////   Table Functions   ///////
  ///////////////////////////////////
  getRanges() {
    return this.ranges.map((e) => e.getComponent());
  }
  getRangesData() {
    return this.ranges.map((e) => e.getData());
  }
  addRangeFromComponent(e, t) {
    return e = e ? e._cell : null, t = t ? t._cell : null, this.addRange(e, t);
  }
  ///////////////////////////////////
  /////// Component Functions ///////
  ///////////////////////////////////
  cellGetRanges(e) {
    var t = [];
    return e.column === this.rowHeader ? t = this.ranges.filter((i) => i.occupiesRow(e.row)) : t = this.ranges.filter((i) => i.occupies(e)), t.map((i) => i.getComponent());
  }
  rowGetRanges(e) {
    var t = this.ranges.filter((i) => i.occupiesRow(e));
    return t.map((i) => i.getComponent());
  }
  colGetRanges(e) {
    var t = this.ranges.filter((i) => i.occupiesColumn(e));
    return t.map((i) => i.getComponent());
  }
  ///////////////////////////////////
  ////////// Event Handlers /////////
  ///////////////////////////////////
  _handleMouseUp(e) {
    this.mousedown = !1, document.removeEventListener("mouseup", this.mouseUpEvent);
  }
  _handleKeyDown(e) {
    if (!this.blockKeydown && (!this.table.modules.edit || this.table.modules.edit && !this.table.modules.edit.currentCell)) {
      if (e.key === "Enter") {
        if (this.table.modules.edit && this.table.modules.edit.currentCell)
          return;
        var t = this.getActiveCell();
        if (!t)
          return;
        this.table.modules.edit.editCell(t), e.preventDefault();
      }
      (e.key === "Backspace" || e.key === "Delete") && this.options("selectableRangeClearCells") && this.activeRange && this.activeRange.clearValues();
    }
  }
  _handleEditKeyDown(e) {
    e.key === "Enter" && (e.ctrlKey || e.altKey || e.metaKey || this.table.modules.edit.checkEditing() || (e.shiftKey ? this.navigateToTabAnchor("up") : this.navigateToTabAnchor("down"), e.preventDefault()));
  }
  initializeFocus(e) {
    var t;
    this.restoreFocus();
    try {
      document.selection ? (t = document.body.createTextRange(), t.moveToElementText(e.getElement()), t.select()) : window.getSelection && (t = document.createRange(), t.selectNode(e.getElement()), window.getSelection().removeAllRanges(), window.getSelection().addRange(t));
    } catch {
    }
  }
  restoreFocus(e) {
    return this.table.rowManager.element.focus(), !0;
  }
  ///////////////////////////////////
  ////// Column Functionality ///////
  ///////////////////////////////////
  handleColumnResized(e) {
    var t;
    this.selecting !== "column" && this.selecting !== "all" || (t = this.ranges.some((i) => i.occupiesColumn(e)), t && this.ranges.forEach((i) => {
      var s = i.getColumns(!0);
      s.forEach((n) => {
        n !== e && n.setWidth(e.width);
      });
    }));
  }
  handleColumnMoving(e, t) {
    this.resetRanges().setBounds(t), this.overlay.style.visibility = "hidden";
  }
  handleColumnMoved(e, t, i) {
    this.activeRange.setBounds(e), this.layoutElement();
  }
  handleColumnMouseDown(e, t) {
    e.button === 2 && (this.selecting === "column" || this.selecting === "all") && this.activeRange.occupiesColumn(t) || this.table.options.movableColumns && this.selecting === "column" && this.activeRange.occupiesColumn(t) || (this.mousedown = !0, document.addEventListener("mouseup", this.mouseUpEvent), this.newSelection(e, t));
  }
  handleColumnMouseMove(e, t) {
    t === this.rowHeader || !this.mousedown || this.selecting === "all" || this.activeRange.setBounds(!1, t, !0);
  }
  ///////////////////////////////////
  //////// Cell Functionality ///////
  ///////////////////////////////////
  renderCell(e) {
    var t = e.getElement(), i = this.ranges.findIndex((s) => s.occupies(e));
    t.classList.toggle("tabulator-range-selected", i !== -1), t.classList.toggle("tabulator-range-only-cell-selected", this.ranges.length === 1 && this.ranges[0].atTopLeft(e) && this.ranges[0].atBottomRight(e)), t.dataset.range = i;
  }
  handleCellMouseDown(e, t) {
    e.button === 2 && (this.activeRange.occupies(t) || (this.selecting === "row" || this.selecting === "all") && this.activeRange.occupiesRow(t.row)) || (this.mousedown = !0, document.addEventListener("mouseup", this.mouseUpEvent), this.newSelection(e, t));
  }
  handleCellMouseMove(e, t) {
    !this.mousedown || this.selecting === "all" || this.activeRange.setBounds(!1, t, !0);
  }
  handleCellClick(e, t) {
    this.initializeFocus(t);
  }
  handleEditingCell(e) {
    this.activeRange && this.activeRange.setBounds(e);
  }
  handleEditorCreated(e, t) {
    t.addEventListener("keydown", this.editKeyDownEvent);
  }
  finishEditingCell(e, t, i) {
    this.blockKeydown = !0, this.table.rowManager.element.focus(), setTimeout(() => {
      this.blockKeydown = !1;
    }, 10);
  }
  ///////////////////////////////////
  ///////     Navigation      ///////
  ///////////////////////////////////
  keyNavigate(e, t) {
    if (this.options("selectableRangeBlurEditOnNavigate") && this.chain("edit-check-editing"))
      if (e === "next" || e === "prev")
        this.options("selectableRangeCommitEditOnNavigate") ? this.restoreFocus() : this.dispatch("edit-cancel-cell");
      else
        return !1;
    e !== "next" && (this.tabAnchorCol = null), e === "prev" ? e = "left" : e === "next" && (e = "right"), this.navigate(!1, !1, e) && t.preventDefault();
  }
  setTabAnchor() {
    this.tabAnchorCol === null && (this.tabAnchorCol = this.activeRange.start.col);
  }
  navigateToTabAnchor(e) {
    const t = this.activeRange;
    this.tabAnchorCol !== null && (t.setStart(t.start.row, this.tabAnchorCol), t.setEnd(t.start.row, this.tabAnchorCol), this.tabAnchorCol = null, this.layoutElement()), this.navigate(!1, !1, e);
  }
  keyNavigateRange(e, t, i, s) {
    this.tabAnchorCol = null, this.navigate(i, s, t) && e.preventDefault();
  }
  navigate(e, t, i) {
    var s = !1, n, r, a, l, h, d, c, u, f, m, p;
    if (this.table.modules.edit && this.table.modules.edit.currentCell)
      return !1;
    if (this.ranges.length > 1 && (this.ranges = this.ranges.filter((v) => v === this.activeRange ? (v.setEnd(v.start.row, v.start.col), !0) : (v.destroy(), !1))), n = this.activeRange, a = n.rect.clone(), r = t ? n.end : n.start, l = r.row, h = r.col, e)
      switch (i) {
        case "left":
          h = this.findJumpCellLeft(n.start.row, r.col);
          break;
        case "right":
          h = this.findJumpCellRight(n.start.row, r.col);
          break;
        case "up":
          l = this.findJumpCellUp(r.row, n.start.col);
          break;
        case "down":
          l = this.findJumpCellDown(r.row, n.start.col);
          break;
      }
    else {
      if (t && (this.selecting === "row" && (i === "left" || i === "right") || this.selecting === "column" && (i === "up" || i === "down")))
        return;
      switch (i) {
        case "left":
          h = Math.max(h - 1, 0);
          break;
        case "right":
          h = Math.min(h + 1, this.getTableColumns().length - 1);
          break;
        case "up":
          l = Math.max(l - 1, 0);
          break;
        case "down":
          l = Math.min(l + 1, this.getTableRows().length - 1);
          break;
      }
    }
    return this.rowHeader && h === 0 && (h = 1), t || n.setStart(l, h), n.setEnd(l, h), t || (this.selecting = "cell"), s = !a.equals(n.rect), s && (d = this.getRowByRangePos(n.end.row), c = this.getColumnByRangePos(n.end.col), u = d.getElement().getBoundingClientRect(), m = c.getElement().getBoundingClientRect(), f = this.table.rowManager.getElement().getBoundingClientRect(), p = this.table.columnManager.getElement().getBoundingClientRect(), u.top >= f.top && u.bottom <= f.bottom || (d.getElement().parentNode && c.getElement().parentNode ? this.autoScroll(n, d.getElement(), c.getElement()) : d.getComponent().scrollTo(void 0, !1)), m.left >= p.left + this.getRowHeaderWidth() && m.right <= p.right || (d.getElement().parentNode && c.getElement().parentNode ? this.autoScroll(n, d.getElement(), c.getElement()) : c.getComponent().scrollTo(void 0, !1)), this.layoutElement()), !0;
  }
  rangeRemoved(e) {
    this.ranges = this.ranges.filter((t) => t !== e), this.activeRange === e && (this.ranges.length ? this.setActiveRange(this.ranges[this.ranges.length - 1]) : this.addRange()), this.layoutElement(!0);
  }
  findJumpRow(e, t, i, s, n) {
    return i && (t = t.reverse()), this.findJumpItem(s, n, t, function(r) {
      return r.getData()[e.getField()];
    });
  }
  findJumpCol(e, t, i, s, n) {
    return i && (t = t.reverse()), this.findJumpItem(s, n, t, function(r) {
      return e.getData()[r.getField()];
    });
  }
  findJumpItem(e, t, i, s) {
    var n;
    for (let r of i) {
      let a = s(r);
      if (e) {
        if (n = r, a)
          break;
      } else if (t) {
        if (n = r, a)
          break;
      } else if (a)
        n = r;
      else
        break;
    }
    return n;
  }
  findJumpCellLeft(e, t) {
    var i = this.getRowByRangePos(e), s = this.getTableColumns(), n = this.isEmpty(i.getData()[s[t].getField()]), r = s[t - 1] ? this.isEmpty(i.getData()[s[t - 1].getField()]) : !1, a = this.rowHeader ? s.slice(1, t) : s.slice(0, t), l = this.findJumpCol(i, a, !0, n, r);
    return l ? l.getPosition() - 1 : t;
  }
  findJumpCellRight(e, t) {
    var i = this.getRowByRangePos(e), s = this.getTableColumns(), n = this.isEmpty(i.getData()[s[t].getField()]), r = s[t + 1] ? this.isEmpty(i.getData()[s[t + 1].getField()]) : !1, a = this.findJumpCol(i, s.slice(t + 1, s.length), !1, n, r);
    return a ? a.getPosition() - 1 : t;
  }
  findJumpCellUp(e, t) {
    var i = this.getColumnByRangePos(t), s = this.getTableRows(), n = this.isEmpty(s[e].getData()[i.getField()]), r = s[e - 1] ? this.isEmpty(s[e - 1].getData()[i.getField()]) : !1, a = this.findJumpRow(i, s.slice(0, e), !0, n, r);
    return a ? a.position - 1 : e;
  }
  findJumpCellDown(e, t) {
    var i = this.getColumnByRangePos(t), s = this.getTableRows(), n = this.isEmpty(s[e].getData()[i.getField()]), r = s[e + 1] ? this.isEmpty(s[e + 1].getData()[i.getField()]) : !1, a = this.findJumpRow(i, s.slice(e + 1, s.length), !1, n, r);
    return a ? a.position - 1 : e;
  }
  ///////////////////////////////////
  ///////      Selection      ///////
  ///////////////////////////////////
  newSelection(e, t) {
    var i;
    if (t.type === "column") {
      if (!this.columnSelection)
        return;
      if (t === this.rowHeader) {
        i = this.resetRanges(), this.selecting = "all";
        var s, n = this.getCell(-1, -1);
        this.rowHeader ? s = this.getCell(0, 1) : s = this.getCell(0, 0), i.setBounds(s, n);
        return;
      } else
        this.selecting = "column";
    } else t.column === this.rowHeader ? this.selecting = "row" : this.selecting = "cell";
    e.shiftKey ? this.activeRange.setBounds(!1, t, !0) : e.ctrlKey ? this.addRange().setBounds(t, void 0, !0) : this.resetRanges().setBounds(t, void 0, !0);
  }
  autoScroll(e, t, i) {
    var s = this.table.rowManager.element, n, r, a, l;
    typeof t > "u" && (t = this.getRowByRangePos(e.end.row).getElement()), typeof i > "u" && (i = this.getColumnByRangePos(e.end.col).getElement()), n = {
      left: i.offsetLeft,
      right: i.offsetLeft + i.offsetWidth,
      top: t.offsetTop,
      bottom: t.offsetTop + t.offsetHeight
    }, r = {
      left: s.scrollLeft + this.getRowHeaderWidth(),
      right: Math.ceil(s.scrollLeft + s.clientWidth),
      top: s.scrollTop,
      bottom: s.scrollTop + s.offsetHeight - this.table.rowManager.scrollbarWidth
    }, a = r.left < n.left && n.left < r.right && r.left < n.right && n.right < r.right, l = r.top < n.top && n.top < r.bottom && r.top < n.bottom && n.bottom < r.bottom, a || (n.left < r.left ? s.scrollLeft = n.left - this.getRowHeaderWidth() : n.right > r.right && (s.scrollLeft = Math.min(n.right - s.clientWidth, n.left - this.getRowHeaderWidth()))), l || (n.top < r.top ? s.scrollTop = n.top : n.bottom > r.bottom && (s.scrollTop = n.bottom - s.clientHeight));
  }
  ///////////////////////////////////
  ///////       Layout        ///////
  ///////////////////////////////////
  layoutChange() {
    this.overlay.style.visibility = "hidden", clearTimeout(this.layoutChangeTimeout), this.layoutChangeTimeout = setTimeout(this.layoutRanges.bind(this), 200);
  }
  redraw(e) {
    e && (this.selecting = "cell", this.setDefaultRange(), this.layoutElement());
  }
  layoutElement(e) {
    var t;
    e ? t = this.table.rowManager.getVisibleRows(!0) : t = this.table.rowManager.getRows(), t.forEach((i) => {
      i.type === "row" && (this.layoutRow(i), i.cells.forEach((s) => this.renderCell(s)));
    }), this.getTableColumns().forEach((i) => {
      this.layoutColumn(i);
    }), this.layoutRanges();
  }
  layoutRow(e) {
    var t = e.getElement(), i = !1, s = this.ranges.some((n) => n.occupiesRow(e));
    this.selecting === "row" ? i = s : this.selecting === "all" && (i = !0), t.classList.toggle("tabulator-range-selected", i), t.classList.toggle("tabulator-range-highlight", s);
  }
  layoutColumn(e) {
    var t = e.getElement(), i = !1, s = this.ranges.some((n) => n.occupiesColumn(e));
    this.selecting === "column" ? i = s : this.selecting === "all" && (i = !0), t.classList.toggle("tabulator-range-selected", i), t.classList.toggle("tabulator-range-highlight", s);
  }
  layoutRanges() {
    var e, t, i;
    this.table.initialized && (e = this.getActiveCell(), e && (t = e.getElement(), i = e.row.getElement(), this.table.rtl ? this.activeRangeCellElement.style.right = i.offsetWidth - t.offsetLeft - t.offsetWidth + "px" : this.activeRangeCellElement.style.left = i.offsetLeft + t.offsetLeft + "px", this.activeRangeCellElement.style.top = i.offsetTop + "px", this.activeRangeCellElement.style.width = t.offsetWidth + "px", this.activeRangeCellElement.style.height = i.offsetHeight + "px", this.ranges.forEach((s) => s.layout()), this.overlay.style.visibility = "visible"));
  }
  ///////////////////////////////////
  ///////  Helper Functions   ///////
  ///////////////////////////////////	
  getCell(e, t) {
    var i;
    return t < 0 && (t = this.getTableColumns().length + t, t < 0) ? null : (e < 0 && (e = this.getTableRows().length + e), i = this.table.rowManager.getRowFromPosition(e + 1), i ? i.getCells(!1, !0).filter((s) => s.column.visible)[t] : null);
  }
  getActiveCell() {
    if (this.activeRange)
      return this.getCell(this.activeRange.start.row, this.activeRange.start.col);
  }
  getRowByRangePos(e) {
    return this.getTableRows()[e];
  }
  getColumnByRangePos(e) {
    return this.getTableColumns()[e];
  }
  getTableRows() {
    return this.table.rowManager.getDisplayRows().filter((e) => e.type === "row");
  }
  getTableColumns() {
    return this.table.columnManager.getVisibleColumnsByIndex();
  }
  setActiveRange(e) {
    this.activeRange = e, this.dispatch("range-active-changed", e);
  }
  addRange(e, t) {
    var i;
    return this.maxRanges !== !0 && this.ranges.length >= this.maxRanges && this.ranges.shift().destroy(), i = new hs(this.table, this, { start: e, end: t }), this.tabAnchorCol = null, this.setActiveRange(i), this.ranges.push(i), this.rangeContainer.appendChild(i.element), i;
  }
  createDefaultRange() {
    var e, t, i;
    return e = this.addRange(), this.table.rowManager.activeRows.length && (i = this.table.rowManager.activeRows[0].cells.filter((s) => s.column.visible), t = i[this.rowHeader ? 1 : 0], t && (e.setBounds(t), this.options("selectableRangeAutoFocus") && this.initializeFocus(t))), e;
  }
  clearRanges() {
    this.ranges.forEach((e) => e.destroy()), this.ranges = [];
  }
  setDefaultRange() {
    this.clearRanges(), this.options("selectableRangeInitializeDefault") && this.createDefaultRange();
  }
  resetRanges() {
    return this.clearRanges(), this.createDefaultRange();
  }
  tableDestroyed() {
    var e;
    document.removeEventListener("mouseup", this.mouseUpEvent), (e = this.fillHandle) == null || e.destroy(), this.table.rowManager.element.removeEventListener("keydown", this.keyDownEvent);
  }
  selectedRows(e) {
    return e ? this.activeRange.getRows().map((t) => t.getComponent()) : this.activeRange.getRows();
  }
  selectedColumns(e) {
    return e ? this.activeRange.getColumns().map((t) => t.getComponent()) : this.activeRange.getColumns();
  }
  getRowHeaderWidth() {
    return this.rowHeader ? this.rowHeader.getElement().offsetWidth : 0;
  }
  isEmpty(e) {
    return e == null || e === "";
  }
}
R(wt, "moduleName", "selectRange"), R(wt, "moduleInitOrder", 1), R(wt, "moduleExtensions", Mr);
function Lr(o, e, t, i, s, n, r) {
  var a = r.alignEmptyValues, l = r.decimalSeparator, h = r.thousandSeparator, d = 0;
  if (o = String(o), e = String(e), h && (o = o.split(h).join(""), e = e.split(h).join("")), l && (o = o.split(l).join("."), e = e.split(l).join(".")), o = parseFloat(o), e = parseFloat(e), isNaN(o))
    d = isNaN(e) ? 0 : -1;
  else if (isNaN(e))
    d = 1;
  else
    return o - e;
  return (a === "top" && n === "desc" || a === "bottom" && n === "asc") && (d *= -1), d;
}
function Sr(o, e, t, i, s, n, r) {
  var a = r.alignEmptyValues, l = 0, h;
  if (!o)
    l = e ? -1 : 0;
  else if (!e)
    l = 1;
  else {
    switch (typeof r.locale) {
      case "boolean":
        r.locale && (h = this.langLocale());
        break;
      case "string":
        h = r.locale;
        break;
    }
    return String(o).toLowerCase().localeCompare(String(e).toLowerCase(), h);
  }
  return (a === "top" && n === "desc" || a === "bottom" && n === "asc") && (l *= -1), l;
}
function Ri(o, e, t, i, s, n, r) {
  var a = this.table.dependencyRegistry.lookup(["luxon", "DateTime"], "DateTime"), l = r.format || "dd/MM/yyyy HH:mm:ss", h = r.alignEmptyValues, d = 0;
  if (typeof a < "u") {
    if (a.isDateTime(o) || (l === "iso" ? o = a.fromISO(String(o)) : l === "x" ? o = a.fromMillis(o) : o = a.fromFormat(String(o), l)), a.isDateTime(e) || (l === "iso" ? e = a.fromISO(String(e)) : l === "x" ? e = a.fromMillis(e) : e = a.fromFormat(String(e), l)), !o.isValid)
      d = e.isValid ? -1 : 0;
    else if (!e.isValid)
      d = 1;
    else
      return o - e;
    return (h === "top" && n === "desc" || h === "bottom" && n === "asc") && (d *= -1), d;
  } else
    console.error("Sort Error - 'datetime' sorter is dependant on luxon.js");
}
function Dr(o, e, t, i, s, n, r) {
  return r.format || (r.format = "dd/MM/yyyy"), Ri.call(this, o, e, t, i, s, n, r);
}
function zr(o, e, t, i, s, n, r) {
  return r.format || (r.format = "HH:mm"), Ri.call(this, o, e, t, i, s, n, r);
}
function Fr(o, e, t, i, s, n, r) {
  var a = o === !0 || o === "true" || o === "True" || o === 1 ? 1 : 0, l = e === !0 || e === "true" || e === "True" || e === 1 ? 1 : 0;
  return a - l;
}
function Hr(o, e, t, i, s, n, r) {
  var a = r.type || "length", l = r.alignEmptyValues, h = 0, d = this.table, c;
  r.valueMap && (typeof r.valueMap == "string" ? c = function(f) {
    return f.map((m) => K.retrieveNestedData(d.options.nestedFieldSeparator, r.valueMap, m));
  } : c = r.valueMap);
  function u(f) {
    var m;
    switch (c && (f = c(f)), a) {
      case "length":
        m = f.length;
        break;
      case "sum":
        m = f.reduce(function(p, v) {
          return p + v;
        });
        break;
      case "max":
        m = Math.max.apply(null, f);
        break;
      case "min":
        m = Math.min.apply(null, f);
        break;
      case "avg":
        m = f.reduce(function(p, v) {
          return p + v;
        }) / f.length;
        break;
      case "string":
        m = f.join("");
        break;
    }
    return m;
  }
  if (!Array.isArray(o))
    h = Array.isArray(e) ? -1 : 0;
  else if (!Array.isArray(e))
    h = 1;
  else
    return a === "string" ? String(u(o)).toLowerCase().localeCompare(String(u(e)).toLowerCase()) : u(e) - u(o);
  return (l === "top" && n === "desc" || l === "bottom" && n === "asc") && (h *= -1), h;
}
function Ar(o, e, t, i, s, n, r) {
  var a = typeof o > "u" ? 0 : 1, l = typeof e > "u" ? 0 : 1;
  return a - l;
}
function Or(o, e, t, i, s, n, r) {
  var a, l, h, d, c = 0, u, f = /(\d+)|(\D+)/g, m = /\d/, p = r.alignEmptyValues, v = 0;
  if (!o && o !== 0)
    v = !e && e !== 0 ? 0 : -1;
  else if (!e && e !== 0)
    v = 1;
  else {
    if (isFinite(o) && isFinite(e)) return o - e;
    if (a = String(o).toLowerCase(), l = String(e).toLowerCase(), a === l) return 0;
    if (!(m.test(a) && m.test(l))) return a > l ? 1 : -1;
    for (a = a.match(f), l = l.match(f), u = a.length > l.length ? l.length : a.length; c < u; )
      if (h = a[c], d = l[c++], h !== d)
        return isFinite(h) && isFinite(d) ? (h.charAt(0) === "0" && (h = "." + h), d.charAt(0) === "0" && (d = "." + d), h - d) : h > d ? 1 : -1;
    return a.length > l.length;
  }
  return (p === "top" && n === "desc" || p === "bottom" && n === "asc") && (v *= -1), v;
}
var Pr = {
  number: Lr,
  string: Sr,
  date: Dr,
  time: zr,
  datetime: Ri,
  boolean: Fr,
  array: Hr,
  exists: Ar,
  alphanum: Or
};
const We = class We extends B {
  constructor(e) {
    super(e), this.sortList = [], this.changed = !1, this.registerTableOption("sortMode", "local"), this.registerTableOption("initialSort", !1), this.registerTableOption("columnHeaderSortMulti", !0), this.registerTableOption("sortOrderReverse", !1), this.registerTableOption("headerSortElement", "<div class='tabulator-arrow'></div>"), this.registerTableOption("headerSortClickElement", "header"), this.registerColumnOption("sorter"), this.registerColumnOption("sorterParams"), this.registerColumnOption("headerSort", !0), this.registerColumnOption("headerSortStartingDir"), this.registerColumnOption("headerSortTristate");
  }
  initialize() {
    this.subscribe("column-layout", this.initializeColumn.bind(this)), this.subscribe("table-built", this.tableBuilt.bind(this)), this.registerDataHandler(this.sort.bind(this), 20), this.registerTableFunction("setSort", this.userSetSort.bind(this)), this.registerTableFunction("getSorters", this.getSort.bind(this)), this.registerTableFunction("clearSort", this.clearSort.bind(this)), this.table.options.sortMode === "remote" && this.subscribe("data-params", this.remoteSortParams.bind(this));
  }
  tableBuilt() {
    this.table.options.initialSort && this.setSort(this.table.options.initialSort);
  }
  remoteSortParams(e, t, i, s) {
    var n = this.getSort();
    return n.forEach((r) => {
      delete r.column;
    }), s.sort = n, s;
  }
  ///////////////////////////////////
  ///////// Table Functions /////////
  ///////////////////////////////////
  userSetSort(e, t) {
    this.setSort(e, t), this.refreshSort();
  }
  clearSort() {
    this.clear(), this.refreshSort();
  }
  ///////////////////////////////////
  ///////// Internal Logic //////////
  ///////////////////////////////////
  //initialize column header for sorting
  initializeColumn(e) {
    var t = !1, i, s;
    switch (typeof e.definition.sorter) {
      case "string":
        We.sorters[e.definition.sorter] ? t = We.sorters[e.definition.sorter] : console.warn("Sort Error - No such sorter found: ", e.definition.sorter);
        break;
      case "function":
        t = e.definition.sorter;
        break;
    }
    if (e.modules.sort = {
      sorter: t,
      dir: "none",
      params: e.definition.sorterParams || {},
      startingDir: e.definition.headerSortStartingDir || "asc",
      tristate: e.definition.headerSortTristate
    }, e.definition.headerSort !== !1) {
      switch (i = e.getElement(), i.classList.add("tabulator-sortable"), s = document.createElement("div"), s.classList.add("tabulator-col-sorter"), this.table.options.headerSortClickElement) {
        case "icon":
          s.classList.add("tabulator-col-sorter-element");
          break;
        case "header":
          i.classList.add("tabulator-col-sorter-element");
          break;
        default:
          i.classList.add("tabulator-col-sorter-element");
          break;
      }
      switch (this.table.options.headerSortElement) {
        case "function":
          break;
        case "object":
          s.appendChild(this.table.options.headerSortElement);
          break;
        default:
          s.innerHTML = this.table.options.headerSortElement;
      }
      e.titleHolderElement.appendChild(s), e.modules.sort.element = s, this.setColumnHeaderSortIcon(e, "none"), this.table.options.headerSortClickElement === "icon" && s.addEventListener("mousedown", (n) => {
        n.stopPropagation();
      }), (this.table.options.headerSortClickElement === "icon" ? s : i).addEventListener("click", (n) => {
        var r = "", a = [], l = !1;
        if (e.modules.sort) {
          if (e.modules.sort.tristate)
            e.modules.sort.dir == "none" ? r = e.modules.sort.startingDir : e.modules.sort.dir == e.modules.sort.startingDir ? r = e.modules.sort.dir == "asc" ? "desc" : "asc" : r = "none";
          else
            switch (e.modules.sort.dir) {
              case "asc":
                r = "desc";
                break;
              case "desc":
                r = "asc";
                break;
              default:
                r = e.modules.sort.startingDir;
            }
          this.table.options.columnHeaderSortMulti && (n.shiftKey || n.ctrlKey) ? (a = this.getSort(), l = a.findIndex((h) => h.field === e.getField()), l > -1 ? (a[l].dir = r, l = a.splice(l, 1)[0], r != "none" && a.push(l)) : r != "none" && a.push({ column: e, dir: r }), this.setSort(a)) : r == "none" ? this.clear() : this.setSort(e, r), this.refreshSort();
        }
      });
    }
  }
  refreshSort() {
    this.table.options.sortMode === "remote" ? this.reloadData(null, !1, !1) : this.refreshData(!0);
  }
  //check if the sorters have changed since last use
  hasChanged() {
    var e = this.changed;
    return this.changed = !1, e;
  }
  //return current sorters
  getSort() {
    var e = this, t = [];
    return e.sortList.forEach(function(i) {
      i.column && t.push({ column: i.column.getComponent(), field: i.column.getField(), dir: i.dir });
    }), t;
  }
  //change sort list and trigger sort
  setSort(e, t) {
    var i = this, s = [];
    Array.isArray(e) || (e = [{ column: e, dir: t }]), e.forEach(function(n) {
      var r;
      r = i.table.columnManager.findColumn(n.column), r ? (n.column = r, s.push(n), i.changed = !0) : console.warn("Sort Warning - Sort field does not exist and is being ignored: ", n.column);
    }), i.sortList = s, this.dispatch("sort-changed");
  }
  //clear sorters
  clear() {
    this.setSort([]);
  }
  //find appropriate sorter for column
  findSorter(e) {
    var t = this.table.rowManager.activeRows[0], i = "string", s, n;
    if (t && (t = t.getData(), s = e.getField(), s))
      switch (n = e.getFieldValue(t), typeof n) {
        case "undefined":
          i = "string";
          break;
        case "boolean":
          i = "boolean";
          break;
        default:
          !isNaN(Number(n)) && n !== "" ? i = "number" : n.match(/((^[0-9]+[a-z]+)|(^[a-z]+[0-9]+))+$/i) && (i = "alphanum");
          break;
      }
    return We.sorters[i];
  }
  //work through sort list sorting data
  sort(e, t) {
    var i = this, s = this.table.options.sortOrderReverse ? i.sortList.slice().reverse() : i.sortList, n = [], r = [];
    return this.subscribedExternal("dataSorting") && this.dispatchExternal("dataSorting", i.getSort()), t || i.clearColumnHeaders(), this.table.options.sortMode !== "remote" ? (s.forEach(function(a, l) {
      var h;
      a.column && (h = a.column.modules.sort, h && (h.sorter || (h.sorter = i.findSorter(a.column)), a.params = typeof h.params == "function" ? h.params(a.column.getComponent(), a.dir) : h.params, n.push(a)), t || i.setColumnHeader(a.column, a.dir));
    }), n.length && i._sortItems(e, n)) : t || s.forEach(function(a, l) {
      i.setColumnHeader(a.column, a.dir);
    }), this.subscribedExternal("dataSorted") && (e.forEach((a) => {
      r.push(a.getComponent());
    }), this.dispatchExternal("dataSorted", i.getSort(), r)), e;
  }
  //clear sort arrows on columns
  clearColumnHeaders() {
    this.table.columnManager.getRealColumns().forEach((e) => {
      e.modules.sort && (e.modules.sort.dir = "none", e.getElement().setAttribute("aria-sort", "none"), this.setColumnHeaderSortIcon(e, "none"));
    });
  }
  //set the column header sort direction
  setColumnHeader(e, t) {
    e.modules.sort.dir = t, e.getElement().setAttribute("aria-sort", t === "asc" ? "ascending" : "descending"), this.setColumnHeaderSortIcon(e, t);
  }
  setColumnHeaderSortIcon(e, t) {
    var i = e.modules.sort.element, s;
    if (e.definition.headerSort && typeof this.table.options.headerSortElement == "function") {
      for (; i.firstChild; ) i.removeChild(i.firstChild);
      s = this.table.options.headerSortElement.call(this.table, e.getComponent(), t), typeof s == "object" ? i.appendChild(s) : i.innerHTML = s;
    }
  }
  //sort each item in sort list
  _sortItems(e, t) {
    var i = t.length - 1;
    e.sort((s, n) => {
      for (var r, a = i; a >= 0; a--) {
        let l = t[a];
        if (r = this._sortRow(s, n, l.column, l.dir, l.params), r !== 0)
          break;
      }
      return r;
    });
  }
  //process individual rows for a sort function on active data
  _sortRow(e, t, i, s, n) {
    var r, a, l = s == "asc" ? e : t, h = s == "asc" ? t : e;
    return e = i.getFieldValue(l.getData()), t = i.getFieldValue(h.getData()), e = typeof e < "u" ? e : "", t = typeof t < "u" ? t : "", r = l.getComponent(), a = h.getComponent(), i.modules.sort.sorter.call(this, e, t, r, a, i.getComponent(), s, n);
  }
};
R(We, "moduleName", "sort"), //load defaults
R(We, "sorters", Pr);
let ui = We;
class _r {
  constructor(e, t) {
    this.columnCount = e, this.rowCount = t, this.columnString = [], this.columns = [], this.rows = [];
  }
  genColumns(e) {
    var t = Math.max(this.columnCount, Math.max(...e.map((i) => i.length)));
    this.columnString = [], this.columns = [];
    for (let i = 1; i <= t; i++)
      this.incrementChar(this.columnString.length - 1), this.columns.push(this.columnString.join(""));
    return this.columns;
  }
  genRows(e) {
    var t = Math.max(this.rowCount, e.length);
    this.rows = [];
    for (let i = 1; i <= t; i++)
      this.rows.push(i);
    return this.rows;
  }
  incrementChar(e) {
    let t = this.columnString[e];
    t ? t !== "Z" ? this.columnString[e] = String.fromCharCode(this.columnString[e].charCodeAt(0) + 1) : (this.columnString[e] = "A", e ? this.incrementChar(e - 1) : this.columnString.push("A")) : this.columnString.push("A");
  }
  setRowCount(e) {
    this.rowCount = e;
  }
  setColumnCount(e) {
    this.columnCount = e;
  }
}
class ds {
  constructor(e) {
    return this._sheet = e, new Proxy(this, {
      get: function(t, i, s) {
        return typeof t[i] < "u" ? t[i] : t._sheet.table.componentFunctionBinder.handle("sheet", t._sheet, i);
      }
    });
  }
  getTitle() {
    return this._sheet.title;
  }
  getKey() {
    return this._sheet.key;
  }
  getDefinition() {
    return this._sheet.getDefinition();
  }
  getData() {
    return this._sheet.getData();
  }
  setData(e) {
    return this._sheet.setData(e);
  }
  clear() {
    return this._sheet.clear();
  }
  remove() {
    return this._sheet.remove();
  }
  active() {
    return this._sheet.active();
  }
  setTitle(e) {
    return this._sheet.setTitle(e);
  }
  setRows(e) {
    return this._sheet.setRows(e);
  }
  setColumns(e) {
    return this._sheet.setColumns(e);
  }
}
class Pi extends ie {
  constructor(e, t) {
    super(e.table), this.spreadsheetManager = e, this.definition = t, this.title = this.definition.title || "", this.key = this.definition.key || this.definition.title, this.rowCount = this.definition.rows, this.columnCount = this.definition.columns, this.data = this.definition.data || [], this.element = null, this.isActive = !1, this.grid = new _r(this.columnCount, this.rowCount), this.defaultColumnDefinition = { width: 100, headerHozAlign: "center", headerSort: !1 }, this.columnDefinition = Object.assign(this.defaultColumnDefinition, this.options("spreadsheetColumnDefinition")), this.columnDefs = [], this.rowDefs = [], this.columnFields = [], this.columns = [], this.rows = [], this.scrollTop = null, this.scrollLeft = null, this.initialize(), this.dispatchExternal("sheetAdded", this.getComponent());
  }
  ///////////////////////////////////
  ///////// Initialization //////////
  ///////////////////////////////////
  initialize() {
    this.initializeElement(), this.initializeColumns(), this.initializeRows();
  }
  reinitialize() {
    this.initializeColumns(), this.initializeRows();
  }
  initializeElement() {
    this.element = document.createElement("div"), this.element.classList.add("tabulator-spreadsheet-tab"), this.element.innerText = this.title, this.element.addEventListener("click", () => {
      this.spreadsheetManager.loadSheet(this);
    });
  }
  initializeColumns() {
    this.grid.setColumnCount(this.columnCount), this.columnFields = this.grid.genColumns(this.data), this.columnDefs = [], this.columnFields.forEach((e) => {
      var t = Object.assign({}, this.columnDefinition);
      t.field = e, t.title = e, this.columnDefs.push(t);
    });
  }
  initializeRows() {
    var e;
    this.grid.setRowCount(this.rowCount), e = this.grid.genRows(this.data), this.rowDefs = [], e.forEach((t, i) => {
      var s = { _id: t }, n = this.data[i];
      n && n.forEach((r, a) => {
        var l = this.columnFields[a];
        l && (s[l] = r);
      }), this.rowDefs.push(s);
    });
  }
  unload() {
    this.isActive = !1, this.scrollTop = this.table.rowManager.scrollTop, this.scrollLeft = this.table.rowManager.scrollLeft, this.data = this.getData(!0), this.element.classList.remove("tabulator-spreadsheet-tab-active");
  }
  load() {
    var e = !this.isActive;
    this.isActive = !0, this.table.blockRedraw(), this.table.setData([]), this.table.setColumns(this.columnDefs), this.table.setData(this.rowDefs), this.table.restoreRedraw(), e && this.scrollTop !== null && (this.table.rowManager.element.scrollLeft = this.scrollLeft, this.table.rowManager.element.scrollTop = this.scrollTop), this.element.classList.add("tabulator-spreadsheet-tab-active"), this.dispatchExternal("sheetLoaded", this.getComponent());
  }
  ///////////////////////////////////
  //////// Helper Functions /////////
  ///////////////////////////////////
  getComponent() {
    return new ds(this);
  }
  getDefinition() {
    return {
      title: this.title,
      key: this.key,
      rows: this.rowCount,
      columns: this.columnCount,
      data: this.getData()
    };
  }
  getData(e) {
    var t = [], i, s, n;
    return this.rowDefs.forEach((r) => {
      var a = [];
      this.columnFields.forEach((l) => {
        a.push(r[l]);
      }), t.push(a);
    }), !e && !this.options("spreadsheetOutputFull") && (i = t.map((r) => r.findLastIndex((a) => typeof a < "u") + 1), s = Math.max(...i), n = i.findLastIndex((r) => r > 0) + 1, t = t.slice(0, n), t = t.map((r) => r.slice(0, s))), t;
  }
  setData(e) {
    this.data = e, this.reinitialize(), this.dispatchExternal("sheetUpdated", this.getComponent()), this.isActive && this.load();
  }
  clear() {
    this.setData([]);
  }
  setTitle(e) {
    this.title = e, this.element.innerText = e, this.dispatchExternal("sheetUpdated", this.getComponent());
  }
  setRows(e) {
    this.rowCount = e, this.initializeRows(), this.dispatchExternal("sheetUpdated", this.getComponent()), this.isActive && this.load();
  }
  setColumns(e) {
    this.columnCount = e, this.reinitialize(), this.dispatchExternal("sheetUpdated", this.getComponent()), this.isActive && this.load();
  }
  remove() {
    this.spreadsheetManager.removeSheet(this);
  }
  destroy() {
    this.element.parentNode && this.element.parentNode.removeChild(this.element), this.dispatchExternal("sheetRemoved", this.getComponent());
  }
  active() {
    this.spreadsheetManager.loadSheet(this);
  }
}
class us extends B {
  constructor(e) {
    super(e), this.sheets = [], this.element = null, this.registerTableOption("spreadsheet", !1), this.registerTableOption("spreadsheetRows", 50), this.registerTableOption("spreadsheetColumns", 50), this.registerTableOption("spreadsheetColumnDefinition", {}), this.registerTableOption("spreadsheetOutputFull", !1), this.registerTableOption("spreadsheetData", !1), this.registerTableOption("spreadsheetSheets", !1), this.registerTableOption("spreadsheetSheetTabs", !1), this.registerTableOption("spreadsheetSheetTabsElement", !1), this.registerTableFunction("setSheets", this.setSheets.bind(this)), this.registerTableFunction("addSheet", this.addSheet.bind(this)), this.registerTableFunction("getSheets", this.getSheets.bind(this)), this.registerTableFunction("getSheetDefinitions", this.getSheetDefinitions.bind(this)), this.registerTableFunction("setSheetData", this.setSheetData.bind(this)), this.registerTableFunction("getSheet", this.getSheet.bind(this)), this.registerTableFunction("getSheetData", this.getSheetData.bind(this)), this.registerTableFunction("clearSheet", this.clearSheet.bind(this)), this.registerTableFunction("removeSheet", this.removeSheetFunc.bind(this)), this.registerTableFunction("activeSheet", this.activeSheetFunc.bind(this));
  }
  ///////////////////////////////////
  ////// Module Initialization //////
  ///////////////////////////////////
  initialize() {
    this.options("spreadsheet") && (this.subscribe("table-initialized", this.tableInitialized.bind(this)), this.subscribe("data-loaded", this.loadRemoteData.bind(this)), this.table.options.index = "_id", this.options("spreadsheetData") && this.options("spreadsheetSheets") && (console.warn("You cannot use spreadsheetData and spreadsheetSheets at the same time, ignoring spreadsheetData"), this.table.options.spreadsheetData = !1), this.compatibilityCheck(), this.options("spreadsheetSheetTabs") && this.initializeTabset());
  }
  compatibilityCheck() {
    this.options("data") && console.warn("Do not use the data option when working with spreadsheets, use either spreadsheetData or spreadsheetSheets to pass data into the table"), this.options("pagination") && console.warn("The spreadsheet module is not compatible with the pagination module"), this.options("groupBy") && console.warn("The spreadsheet module is not compatible with the row grouping module"), this.options("responsiveCollapse") && console.warn("The spreadsheet module is not compatible with the responsive collapse module");
  }
  initializeTabset() {
    this.element = document.createElement("div"), this.element.classList.add("tabulator-spreadsheet-tabs");
    var e = this.options("spreadsheetSheetTabsElement");
    e && !(e instanceof HTMLElement) && (e = document.querySelector(e), e || console.warn("Unable to find element matching spreadsheetSheetTabsElement selector:", this.options("spreadsheetSheetTabsElement"))), e ? e.appendChild(this.element) : this.footerAppend(this.element);
  }
  tableInitialized() {
    this.sheets.length ? this.loadSheet(this.sheets[0]) : this.options("spreadsheetSheets") ? this.loadSheets(this.options("spreadsheetSheets")) : this.options("spreadsheetData") && this.loadData(this.options("spreadsheetData"));
  }
  ///////////////////////////////////
  /////////// Ajax Parsing //////////
  ///////////////////////////////////
  loadRemoteData(e, t, i) {
    return console.log("data", e, t, i), Array.isArray(e) ? (this.table.dataLoader.clearAlert(), this.dispatchExternal("dataLoaded", e), !e.length || Array.isArray(e[0]) ? this.loadData(e) : this.loadSheets(e)) : console.error(`Spreadsheet Loading Error - Unable to process remote data due to invalid data type 
Expecting: array 
Received: `, typeof e, `
Data:     `, e), !1;
  }
  ///////////////////////////////////
  ///////// Sheet Management ////////
  ///////////////////////////////////
  loadData(e) {
    var t = {
      data: e
    };
    this.loadSheet(this.newSheet(t));
  }
  destroySheets() {
    this.sheets.forEach((e) => {
      e.destroy();
    }), this.sheets = [], this.activeSheet = null;
  }
  loadSheets(e) {
    Array.isArray(e) || (e = []), this.destroySheets(), e.forEach((t) => {
      this.newSheet(t);
    }), this.loadSheet(this.sheets[0]);
  }
  loadSheet(e) {
    this.activeSheet !== e && (this.activeSheet && this.activeSheet.unload(), this.activeSheet = e, e.load());
  }
  newSheet(e = {}) {
    var t;
    return e.rows || (e.rows = this.options("spreadsheetRows")), e.columns || (e.columns = this.options("spreadsheetColumns")), t = new Pi(this, e), this.sheets.push(t), this.element && this.element.appendChild(t.element), t;
  }
  removeSheet(e) {
    var t = this.sheets.indexOf(e), i;
    this.sheets.length > 1 ? t > -1 && (this.sheets.splice(t, 1), e.destroy(), this.activeSheet === e && (i = this.sheets[t - 1] || this.sheets[0], i ? this.loadSheet(i) : this.activeSheet = null)) : console.warn("Unable to remove sheet, at least one sheet must be active");
  }
  lookupSheet(e) {
    return e ? e instanceof Pi ? e : e instanceof ds ? e._sheet : this.sheets.find((t) => t.key === e) || !1 : this.activeSheet;
  }
  ///////////////////////////////////
  //////// Public Functions /////////
  ///////////////////////////////////
  setSheets(e) {
    return this.loadSheets(e), this.getSheets();
  }
  addSheet(e) {
    return this.newSheet(e).getComponent();
  }
  getSheetDefinitions() {
    return this.sheets.map((e) => e.getDefinition());
  }
  getSheets() {
    return this.sheets.map((e) => e.getComponent());
  }
  getSheet(e) {
    var t = this.lookupSheet(e);
    return t ? t.getComponent() : !1;
  }
  setSheetData(e, t) {
    e && !t && (t = e, e = !1);
    var i = this.lookupSheet(e);
    return i ? i.setData(t) : !1;
  }
  getSheetData(e) {
    var t = this.lookupSheet(e);
    return t ? t.getData() : !1;
  }
  clearSheet(e) {
    var t = this.lookupSheet(e);
    return t ? t.clear() : !1;
  }
  removeSheetFunc(e) {
    var t = this.lookupSheet(e);
    t && this.removeSheet(t);
  }
  activeSheetFunc(e) {
    var t = this.lookupSheet(e);
    return t ? this.loadSheet(t) : !1;
  }
}
R(us, "moduleName", "spreadsheet");
class cs extends B {
  constructor(e) {
    super(e), this.tooltipSubscriber = null, this.headerSubscriber = null, this.timeout = null, this.popupInstance = null, this.registerTableOption("tooltipDelay", 300), this.registerColumnOption("tooltip"), this.registerColumnOption("headerTooltip");
  }
  initialize() {
    this.deprecatedOptionsCheck(), this.subscribe("column-init", this.initializeColumn.bind(this));
  }
  deprecatedOptionsCheck() {
  }
  initializeColumn(e) {
    e.definition.headerTooltip && !this.headerSubscriber && (this.headerSubscriber = !0, this.subscribe("column-mousemove", this.mousemoveCheck.bind(this, "headerTooltip")), this.subscribe("column-mouseout", this.mouseoutCheck.bind(this, "headerTooltip"))), e.definition.tooltip && !this.tooltipSubscriber && (this.tooltipSubscriber = !0, this.subscribe("cell-mousemove", this.mousemoveCheck.bind(this, "tooltip")), this.subscribe("cell-mouseout", this.mouseoutCheck.bind(this, "tooltip")));
  }
  mousemoveCheck(e, t, i) {
    var s = e === "tooltip" ? i.column.definition.tooltip : i.definition.headerTooltip;
    s && (this.clearPopup(), this.timeout = setTimeout(this.loadTooltip.bind(this, t, i, s), this.table.options.tooltipDelay));
  }
  mouseoutCheck(e, t, i) {
    this.popupInstance || this.clearPopup();
  }
  clearPopup(e, t, i) {
    clearTimeout(this.timeout), this.timeout = null, this.popupInstance && this.popupInstance.hide();
  }
  loadTooltip(e, t, i) {
    var s, n, r;
    function a(l) {
      n = l;
    }
    typeof i == "function" && (i = i(e, t.getComponent(), a)), i instanceof HTMLElement ? s = i : (s = document.createElement("div"), i === !0 && (t instanceof ft ? i = t.value : t.definition.field ? this.langBind("columns|" + t.definition.field, (l) => {
      s.innerHTML = i = l || t.definition.title;
    }) : i = t.definition.title), s.innerHTML = i), (i || i === 0 || i === !1) && (s.classList.add("tabulator-tooltip"), s.addEventListener("mousemove", (l) => l.preventDefault()), this.popupInstance = this.popup(s), typeof n == "function" && this.popupInstance.renderCallback(n), r = this.popupInstance.containerEventCoords(e), this.popupInstance.show(r.x + 15, r.y + 15).hideOnBlur(() => {
      this.dispatchExternal("TooltipClosed", t.getComponent()), this.popupInstance = null;
    }), this.dispatchExternal("TooltipOpened", t.getComponent()));
  }
}
R(cs, "moduleName", "tooltip");
var Nr = {
  //is integer
  integer: function(o, e, t) {
    return e === "" || e === null || typeof e > "u" ? !0 : (e = Number(e), !isNaN(e) && isFinite(e) && Math.floor(e) === e);
  },
  //is float
  float: function(o, e, t) {
    return e === "" || e === null || typeof e > "u" ? !0 : (e = Number(e), !isNaN(e) && isFinite(e) && e % 1 !== 0);
  },
  //must be a number
  numeric: function(o, e, t) {
    return e === "" || e === null || typeof e > "u" ? !0 : !isNaN(e);
  },
  //must be a string
  string: function(o, e, t) {
    return e === "" || e === null || typeof e > "u" ? !0 : isNaN(e);
  },
  //must be alphanumeric
  alphanumeric: function(o, e, t) {
    if (e === "" || e === null || typeof e > "u")
      return !0;
    var i = new RegExp(/^[a-z0-9]+$/i);
    return i.test(e);
  },
  //maximum value
  max: function(o, e, t) {
    return e === "" || e === null || typeof e > "u" ? !0 : parseFloat(e) <= t;
  },
  //minimum value
  min: function(o, e, t) {
    return e === "" || e === null || typeof e > "u" ? !0 : parseFloat(e) >= t;
  },
  //starts with  value
  starts: function(o, e, t) {
    return e === "" || e === null || typeof e > "u" ? !0 : String(e).toLowerCase().startsWith(String(t).toLowerCase());
  },
  //ends with  value
  ends: function(o, e, t) {
    return e === "" || e === null || typeof e > "u" ? !0 : String(e).toLowerCase().endsWith(String(t).toLowerCase());
  },
  //minimum string length
  minLength: function(o, e, t) {
    return e === "" || e === null || typeof e > "u" ? !0 : String(e).length >= t;
  },
  //maximum string length
  maxLength: function(o, e, t) {
    return e === "" || e === null || typeof e > "u" ? !0 : String(e).length <= t;
  },
  //in provided value list
  in: function(o, e, t) {
    return e === "" || e === null || typeof e > "u" ? !0 : (typeof t == "string" && (t = t.split("|")), t.indexOf(e) > -1);
  },
  //must match provided regex
  regex: function(o, e, t) {
    if (e === "" || e === null || typeof e > "u")
      return !0;
    var i = new RegExp(t);
    return i.test(e);
  },
  //value must be unique in this column
  unique: function(o, e, t) {
    if (e === "" || e === null || typeof e > "u")
      return !0;
    var i = t === "ignorecase" ? (r, a) => typeof r == "string" && typeof a == "string" ? r.toLowerCase() == a.toLowerCase() : r == a : (r, a) => r == a, s = o.getData(), n = o.getColumn()._getSelf();
    return !this.table.rowManager.rows.some(function(r) {
      var a = r.getData();
      if (a !== s)
        return i(e, n.getFieldValue(a));
    });
  },
  //must have a value
  required: function(o, e, t) {
    return e !== "" && e !== null && typeof e < "u";
  }
};
const ht = class ht extends B {
  constructor(e) {
    super(e), this.invalidCells = [], this.registerTableOption("validationMode", "blocking"), this.registerColumnOption("validator"), this.registerTableFunction("getInvalidCells", this.getInvalidCells.bind(this)), this.registerTableFunction("clearCellValidation", this.userClearCellValidation.bind(this)), this.registerTableFunction("validate", this.userValidate.bind(this)), this.registerComponentFunction("cell", "isValid", this.cellIsValid.bind(this)), this.registerComponentFunction("cell", "clearValidation", this.clearValidation.bind(this)), this.registerComponentFunction("cell", "validate", this.cellValidate.bind(this)), this.registerComponentFunction("column", "validate", this.columnValidate.bind(this)), this.registerComponentFunction("row", "validate", this.rowValidate.bind(this));
  }
  initialize() {
    this.subscribe("cell-delete", this.clearValidation.bind(this)), this.subscribe("column-layout", this.initializeColumnCheck.bind(this)), this.subscribe("edit-success", this.editValidate.bind(this)), this.subscribe("edit-editor-clear", this.editorClear.bind(this)), this.subscribe("edit-edited-clear", this.editedClear.bind(this));
  }
  ///////////////////////////////////
  ///////// Event Handling //////////
  ///////////////////////////////////
  editValidate(e, t, i) {
    var s = this.table.options.validationMode !== "manual" ? this.validate(e.column.modules.validate, e, t) : !0;
    return s !== !0 && setTimeout(() => {
      e.getElement().classList.add("tabulator-validation-fail"), this.dispatchExternal("validationFailed", e.getComponent(), t, s);
    }), s;
  }
  editorClear(e, t) {
    t && e.column.modules.validate && this.cellValidate(e), e.getElement().classList.remove("tabulator-validation-fail");
  }
  editedClear(e) {
    e.modules.validate && (e.modules.validate.invalid = !1);
  }
  ///////////////////////////////////
  ////////// Cell Functions /////////
  ///////////////////////////////////
  cellIsValid(e) {
    return e.modules.validate && e.modules.validate.invalid || !0;
  }
  cellValidate(e) {
    return this.validate(e.column.modules.validate, e, e.getValue());
  }
  ///////////////////////////////////
  ///////// Column Functions ////////
  ///////////////////////////////////
  columnValidate(e) {
    var t = [];
    return e.cells.forEach((i) => {
      this.cellValidate(i) !== !0 && t.push(i.getComponent());
    }), t.length ? t : !0;
  }
  ///////////////////////////////////
  ////////// Row Functions //////////
  ///////////////////////////////////
  rowValidate(e) {
    var t = [];
    return e.cells.forEach((i) => {
      this.cellValidate(i) !== !0 && t.push(i.getComponent());
    }), t.length ? t : !0;
  }
  ///////////////////////////////////
  ///////// Table Functions /////////
  ///////////////////////////////////
  userClearCellValidation(e) {
    e || (e = this.getInvalidCells()), Array.isArray(e) || (e = [e]), e.forEach((t) => {
      this.clearValidation(t._getSelf());
    });
  }
  userValidate(e) {
    var t = [];
    return this.table.rowManager.rows.forEach((i) => {
      i = i.getComponent();
      var s = i.validate();
      s !== !0 && (t = t.concat(s));
    }), t.length ? t : !0;
  }
  ///////////////////////////////////
  ///////// Internal Logic //////////
  ///////////////////////////////////
  initializeColumnCheck(e) {
    typeof e.definition.validator < "u" && this.initializeColumn(e);
  }
  //validate
  initializeColumn(e) {
    var t = this, i = [], s;
    e.definition.validator && (Array.isArray(e.definition.validator) ? e.definition.validator.forEach((n) => {
      s = t._extractValidator(n), s && i.push(s);
    }) : (s = this._extractValidator(e.definition.validator), s && i.push(s)), e.modules.validate = i.length ? i : !1);
  }
  _extractValidator(e) {
    var t, i, s;
    switch (typeof e) {
      case "string":
        return s = e.indexOf(":"), s > -1 ? (t = e.substring(0, s), i = e.substring(s + 1)) : t = e, this._buildValidator(t, i);
      case "function":
        return this._buildValidator(e);
      case "object":
        return this._buildValidator(e.type, e.parameters);
    }
  }
  _buildValidator(e, t) {
    var i = typeof e == "function" ? e : ht.validators[e];
    return i ? {
      type: typeof e == "function" ? "function" : e,
      func: i,
      params: t
    } : (console.warn("Validator Setup Error - No matching validator found:", e), !1);
  }
  validate(e, t, i) {
    var s = this, n = [], r = this.invalidCells.indexOf(t);
    return e && e.forEach((a) => {
      a.func.call(s, t.getComponent(), i, a.params) || n.push({
        type: a.type,
        parameters: a.params
      });
    }), t.modules.validate || (t.modules.validate = {}), n.length ? (t.modules.validate.invalid = n, this.table.options.validationMode !== "manual" && t.getElement().classList.add("tabulator-validation-fail"), r == -1 && this.invalidCells.push(t)) : (t.modules.validate.invalid = !1, t.getElement().classList.remove("tabulator-validation-fail"), r > -1 && this.invalidCells.splice(r, 1)), n.length ? n : !0;
  }
  getInvalidCells() {
    var e = [];
    return this.invalidCells.forEach((t) => {
      e.push(t.getComponent());
    }), e;
  }
  clearValidation(e) {
    var t;
    e.modules.validate && e.modules.validate.invalid && (e.getElement().classList.remove("tabulator-validation-fail"), e.modules.validate.invalid = !1, t = this.invalidCells.indexOf(e), t > -1 && this.invalidCells.splice(t, 1));
  }
};
R(ht, "moduleName", "validate"), //load defaults
R(ht, "validators", Nr);
let ci = ht;
var jt = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  AccessorModule: Ut,
  AjaxModule: Kt,
  ClipboardModule: Jt,
  ColumnCalcsModule: Xt,
  DataTreeModule: Ji,
  DownloadModule: Yt,
  EditModule: Zt,
  ExportModule: Qt,
  FilterModule: ei,
  FormatModule: ti,
  FrozenColumnsModule: Xi,
  FrozenRowsModule: Yi,
  GroupRowsModule: Zi,
  HistoryModule: ii,
  HtmlTableImportModule: Qi,
  ImportModule: si,
  InteractionModule: es,
  KeybindingsModule: ni,
  MenuModule: ts,
  MoveColumnsModule: is,
  MoveRowsModule: ri,
  MutatorModule: oi,
  PageModule: ai,
  PersistenceModule: li,
  PopupModule: ss,
  PrintModule: ns,
  ReactiveDataModule: rs,
  ResizeColumnsModule: os,
  ResizeRowsModule: as,
  ResizeTableModule: ls,
  ResponsiveLayoutModule: hi,
  SelectRangeModule: wt,
  SelectRowModule: di,
  SortModule: ui,
  SpreadsheetModule: us,
  TooltipModule: cs,
  ValidateModule: ci
}), Br = {
  debugEventsExternal: !1,
  //flag to console log events
  debugEventsInternal: !1,
  //flag to console log events
  debugInvalidOptions: !0,
  //allow toggling of invalid option warnings
  debugInvalidComponentFuncs: !0,
  //allow toggling of invalid component warnings
  debugInitialization: !0,
  //allow toggling of pre initialization function call warnings
  debugDeprecation: !0,
  //allow toggling of deprecation warnings
  height: !1,
  //height of tabulator
  minHeight: !1,
  //minimum height of tabulator
  maxHeight: !1,
  //maximum height of tabulator
  columnHeaderVertAlign: "top",
  //vertical alignment of column headers
  popupContainer: !1,
  columns: [],
  //store for colum header info
  columnDefaults: {},
  //store column default props
  rowHeader: !1,
  data: !1,
  //default starting data
  autoColumns: !1,
  //build columns from data row structure
  autoColumnsDefinitions: !1,
  nestedFieldSeparator: ".",
  //separator for nested data
  footerElement: !1,
  //hold footer element
  index: "id",
  //filed for row index
  textDirection: "auto",
  addRowPos: "bottom",
  //position to insert blank rows, top|bottom
  headerVisible: !0,
  //hide header
  renderVertical: "virtual",
  renderHorizontal: "basic",
  renderVerticalBuffer: 0,
  // set virtual DOM buffer size
  scrollToRowPosition: "top",
  scrollToRowIfVisible: !0,
  scrollToColumnPosition: "left",
  scrollToColumnIfVisible: !0,
  rowFormatter: !1,
  rowFormatterPrint: null,
  rowFormatterClipboard: null,
  rowFormatterHtmlOutput: null,
  rowHeight: null,
  placeholder: !1,
  dataLoader: !0,
  dataLoaderLoading: !1,
  dataLoaderError: !1,
  dataLoaderErrorTimeout: 3e3,
  dataSendParams: {},
  dataReceiveParams: {},
  dependencies: {}
};
class fs {
  constructor(e, t, i = {}) {
    this.table = e, this.msgType = t, this.registeredDefaults = Object.assign({}, i);
  }
  register(e, t) {
    this.registeredDefaults[e] = t;
  }
  generate(e, t = {}) {
    var i = Object.assign({}, this.registeredDefaults), s = this.table.options.debugInvalidOptions || t.debugInvalidOptions === !0;
    Object.assign(i, e);
    for (let n in t)
      i.hasOwnProperty(n) || (s && console.warn("Invalid " + this.msgType + " option:", n), i[n] = t.key);
    for (let n in i)
      n in t ? i[n] = t[n] : Array.isArray(i[n]) ? i[n] = Object.assign([], i[n]) : typeof i[n] == "object" && i[n] !== null ? i[n] = Object.assign({}, i[n]) : typeof i[n] > "u" && delete i[n];
    return i;
  }
}
class Lt extends ie {
  constructor(e) {
    super(e), this.elementVertical = e.rowManager.element, this.elementHorizontal = e.columnManager.element, this.tableElement = e.rowManager.tableElement, this.verticalFillMode = "fit";
  }
  ///////////////////////////////////
  /////// Internal Bindings /////////
  ///////////////////////////////////
  initialize() {
  }
  clearRows() {
  }
  clearColumns() {
  }
  reinitializeColumnWidths(e) {
  }
  renderRows() {
  }
  renderColumns() {
  }
  rerenderRows(e) {
    e && e();
  }
  rerenderColumns(e, t) {
  }
  renderRowCells(e) {
  }
  rerenderRowCells(e, t) {
  }
  scrollColumns(e, t) {
  }
  scrollRows(e, t) {
  }
  resize() {
  }
  scrollToRow(e) {
  }
  scrollToRowNearestTop(e) {
  }
  visibleRows(e) {
    return [];
  }
  ///////////////////////////////////
  //////// Helper Functions /////////
  ///////////////////////////////////
  rows() {
    return this.table.rowManager.getDisplayRows();
  }
  styleRow(e, t) {
    var i = e.getElement();
    t % 2 ? (i.classList.add("tabulator-row-even"), i.classList.remove("tabulator-row-odd")) : (i.classList.add("tabulator-row-odd"), i.classList.remove("tabulator-row-even"));
  }
  ///////////////////////////////////
  /////// External Triggers /////////
  /////// (DO NOT OVERRIDE) /////////
  ///////////////////////////////////
  clear() {
    this.clearRows(), this.clearColumns();
  }
  render() {
    this.renderRows(), this.renderColumns();
  }
  rerender(e) {
    this.rerenderRows(), this.rerenderColumns();
  }
  scrollToRowPosition(e, t, i) {
    var s = this.rows().indexOf(e), n = e.getElement(), r = 0;
    return new Promise((a, l) => {
      if (s > -1) {
        if (typeof i > "u" && (i = this.table.options.scrollToRowIfVisible), !i && K.elVisible(n) && (r = K.elOffset(n).top - K.elOffset(this.elementVertical).top, r > 0 && r < this.elementVertical.clientHeight - n.offsetHeight))
          return a(), !1;
        switch (typeof t > "u" && (t = this.table.options.scrollToRowPosition), t === "nearest" && (t = this.scrollToRowNearestTop(e) ? "top" : "bottom"), this.scrollToRow(e), t) {
          case "middle":
          case "center":
            this.elementVertical.scrollHeight - this.elementVertical.scrollTop == this.elementVertical.clientHeight ? this.elementVertical.scrollTop = this.elementVertical.scrollTop + (n.offsetTop - this.elementVertical.scrollTop) - (this.elementVertical.scrollHeight - n.offsetTop) / 2 : this.elementVertical.scrollTop = this.elementVertical.scrollTop - this.elementVertical.clientHeight / 2;
            break;
          case "bottom":
            this.elementVertical.scrollHeight - this.elementVertical.scrollTop == this.elementVertical.clientHeight ? this.elementVertical.scrollTop = this.elementVertical.scrollTop - (this.elementVertical.scrollHeight - n.offsetTop) + n.offsetHeight : this.elementVertical.scrollTop = this.elementVertical.scrollTop - this.elementVertical.clientHeight + n.offsetHeight;
            break;
          case "top":
            this.elementVertical.scrollTop = n.offsetTop;
            break;
        }
        a();
      } else
        console.warn("Scroll Error - Row not visible"), l("Scroll Error - Row not visible");
    });
  }
}
class Ir extends Lt {
  constructor(e) {
    super(e);
  }
  renderRowCells(e, t) {
    const i = document.createDocumentFragment();
    e.cells.forEach((s) => {
      i.appendChild(s.getElement());
    }), e.element.appendChild(i), t || e.cells.forEach((s) => {
      s.cellRendered();
    });
  }
  reinitializeColumnWidths(e) {
    e.forEach(function(t) {
      t.reinitializeWidth();
    });
  }
}
class Vr extends Lt {
  constructor(e) {
    super(e), this.leftCol = 0, this.rightCol = 0, this.scrollLeft = 0, this.vDomScrollPosLeft = 0, this.vDomScrollPosRight = 0, this.vDomPadLeft = 0, this.vDomPadRight = 0, this.fitDataColAvg = 0, this.windowBuffer = 200, this.visibleRows = null, this.initialized = !1, this.isFitData = !1, this.columns = [];
  }
  initialize() {
    this.compatibilityCheck(), this.layoutCheck(), this.vertScrollListen();
  }
  compatibilityCheck() {
    this.options("layout") == "fitDataTable" && console.warn("Horizontal Virtual DOM is not compatible with fitDataTable layout mode"), this.options("responsiveLayout") && console.warn("Horizontal Virtual DOM is not compatible with responsive columns"), this.options("rtl") && console.warn("Horizontal Virtual DOM is not currently compatible with RTL text direction");
  }
  layoutCheck() {
    this.isFitData = this.options("layout").startsWith("fitData");
  }
  vertScrollListen() {
    this.subscribe("scroll-vertical", this.clearVisRowCache.bind(this)), this.subscribe("data-refreshed", this.clearVisRowCache.bind(this));
  }
  clearVisRowCache() {
    this.visibleRows = null;
  }
  //////////////////////////////////////
  ///////// Public Functions ///////////
  //////////////////////////////////////
  renderColumns(e, t) {
    this.dataChange();
  }
  scrollColumns(e, t) {
    this.scrollLeft != e && (this.scrollLeft = e, this.scroll(e - (this.vDomScrollPosLeft + this.windowBuffer)));
  }
  calcWindowBuffer() {
    var e = this.elementVertical.clientWidth;
    this.table.columnManager.columnsByIndex.forEach((t) => {
      if (t.visible) {
        var i = t.getWidth();
        i > e && (e = i);
      }
    }), this.windowBuffer = e * 2;
  }
  rerenderColumns(e, t) {
    var i = {
      cols: this.columns,
      leftCol: this.leftCol,
      rightCol: this.rightCol
    }, s = 0;
    e && !this.initialized || (this.clear(), this.calcWindowBuffer(), this.scrollLeft = this.elementVertical.scrollLeft, this.vDomScrollPosLeft = this.scrollLeft - this.windowBuffer, this.vDomScrollPosRight = this.scrollLeft + this.elementVertical.clientWidth + this.windowBuffer, this.table.columnManager.columnsByIndex.forEach((n) => {
      var r = {}, a;
      n.visible && (n.modules.frozen || (a = n.getWidth(), r.leftPos = s, r.rightPos = s + a, r.width = a, this.isFitData && (r.fitDataCheck = n.modules.vdomHoz ? n.modules.vdomHoz.fitDataCheck : !0), s + a > this.vDomScrollPosLeft && s < this.vDomScrollPosRight ? (this.leftCol == -1 && (this.leftCol = this.columns.length, this.vDomPadLeft = s), this.rightCol = this.columns.length) : this.leftCol !== -1 && (this.vDomPadRight += a), this.columns.push(n), n.modules.vdomHoz = r, s += a));
    }), this.tableElement.style.paddingLeft = this.vDomPadLeft + "px", this.tableElement.style.paddingRight = this.vDomPadRight + "px", this.initialized = !0, t || (!e || this.reinitChanged(i)) && this.reinitializeRows(), this.elementVertical.scrollLeft = this.scrollLeft);
  }
  renderRowCells(e) {
    if (this.initialized)
      this.initializeRow(e);
    else {
      const t = document.createDocumentFragment();
      e.cells.forEach((i) => {
        t.appendChild(i.getElement());
      }), e.element.appendChild(t), e.cells.forEach((i) => {
        i.cellRendered();
      });
    }
  }
  rerenderRowCells(e, t) {
    this.reinitializeRow(e, t);
  }
  reinitializeColumnWidths(e) {
    for (let t = this.leftCol; t <= this.rightCol; t++) {
      let i = this.columns[t];
      i && i.reinitializeWidth();
    }
  }
  //////////////////////////////////////
  //////// Internal Rendering //////////
  //////////////////////////////////////
  deinitialize() {
    this.initialized = !1;
  }
  clear() {
    this.columns = [], this.leftCol = -1, this.rightCol = 0, this.vDomScrollPosLeft = 0, this.vDomScrollPosRight = 0, this.vDomPadLeft = 0, this.vDomPadRight = 0;
  }
  dataChange() {
    var e = !1, t, i;
    if (this.isFitData) {
      if (this.table.columnManager.columnsByIndex.forEach((s) => {
        !s.definition.width && s.visible && (e = !0);
      }), e && this.table.rowManager.getDisplayRows().length && (this.vDomScrollPosRight = this.scrollLeft + this.elementVertical.clientWidth + this.windowBuffer, t = this.chain("rows-sample", [1], [], () => this.table.rowManager.getDisplayRows())[0], t)) {
        i = t.getElement(), t.generateCells(), this.tableElement.appendChild(i);
        for (let s = 0; s < t.cells.length; s++) {
          let n = t.cells[s];
          i.appendChild(n.getElement()), n.column.reinitializeWidth();
        }
        i.parentNode.removeChild(i), this.rerenderColumns(!1, !0);
      }
    } else
      this.options("layout") === "fitColumns" && (this.layoutRefresh(), this.rerenderColumns(!1, !0));
  }
  reinitChanged(e) {
    var t = !0;
    return e.cols.length !== this.columns.length || e.leftCol !== this.leftCol || e.rightCol !== this.rightCol ? !0 : (e.cols.forEach((i, s) => {
      i !== this.columns[s] && (t = !1);
    }), !t);
  }
  reinitializeRows() {
    var e = this.getVisibleRows(), t = this.table.rowManager.getRows().filter((i) => !e.includes(i));
    e.forEach((i) => {
      this.reinitializeRow(i, !0);
    }), t.forEach((i) => {
      i.deinitialize();
    });
  }
  getVisibleRows() {
    return this.visibleRows || (this.visibleRows = this.table.rowManager.getVisibleRows()), this.visibleRows;
  }
  scroll(e) {
    this.vDomScrollPosLeft += e, this.vDomScrollPosRight += e, Math.abs(e) > this.windowBuffer / 2 ? this.rerenderColumns() : e > 0 ? (this.addColRight(), this.removeColLeft()) : (this.addColLeft(), this.removeColRight());
  }
  colPositionAdjust(e, t, i) {
    for (let s = e; s < t; s++) {
      let n = this.columns[s];
      n.modules.vdomHoz.leftPos += i, n.modules.vdomHoz.rightPos += i;
    }
  }
  addColRight() {
    for (var e = !1, t = !0; t; ) {
      let i = this.columns[this.rightCol + 1];
      i && i.modules.vdomHoz.leftPos <= this.vDomScrollPosRight ? (e = !0, this.getVisibleRows().forEach((s) => {
        if (s.type !== "group") {
          var n = s.getCell(i);
          s.getElement().insertBefore(n.getElement(), s.getCell(this.columns[this.rightCol]).getElement().nextSibling), n.cellRendered();
        }
      }), this.fitDataColActualWidthCheck(i), this.rightCol++, this.getVisibleRows().forEach((s) => {
        s.type !== "group" && (s.modules.vdomHoz.rightCol = this.rightCol);
      }), this.rightCol >= this.columns.length - 1 ? this.vDomPadRight = 0 : this.vDomPadRight -= i.getWidth()) : t = !1;
    }
    e && (this.tableElement.style.paddingRight = this.vDomPadRight + "px");
  }
  addColLeft() {
    for (var e = !1, t = !0; t; ) {
      let i = this.columns[this.leftCol - 1];
      if (i)
        if (i.modules.vdomHoz.rightPos >= this.vDomScrollPosLeft) {
          e = !0, this.getVisibleRows().forEach((n) => {
            if (n.type !== "group") {
              var r = n.getCell(i);
              n.getElement().insertBefore(r.getElement(), n.getCell(this.columns[this.leftCol]).getElement()), r.cellRendered();
            }
          }), this.leftCol--, this.getVisibleRows().forEach((n) => {
            n.type !== "group" && (n.modules.vdomHoz.leftCol = this.leftCol);
          }), this.leftCol <= 0 ? this.vDomPadLeft = 0 : this.vDomPadLeft -= i.getWidth();
          let s = this.fitDataColActualWidthCheck(i);
          s && (this.scrollLeft = this.elementVertical.scrollLeft = this.elementVertical.scrollLeft + s, this.vDomPadRight -= s);
        } else
          t = !1;
      else
        t = !1;
    }
    e && (this.tableElement.style.paddingLeft = this.vDomPadLeft + "px");
  }
  removeColRight() {
    for (var e = !1, t = !0; t; ) {
      let i = this.columns[this.rightCol];
      i && i.modules.vdomHoz.leftPos > this.vDomScrollPosRight ? (e = !0, this.getVisibleRows().forEach((s) => {
        if (s.type !== "group") {
          var n = s.getCell(i);
          try {
            s.getElement().removeChild(n.getElement());
          } catch (r) {
            console.warn("Could not removeColRight", r.message);
          }
        }
      }), this.vDomPadRight += i.getWidth(), this.rightCol--, this.getVisibleRows().forEach((s) => {
        s.type !== "group" && (s.modules.vdomHoz.rightCol = this.rightCol);
      })) : t = !1;
    }
    e && (this.tableElement.style.paddingRight = this.vDomPadRight + "px");
  }
  removeColLeft() {
    for (var e = !1, t = !0; t; ) {
      let i = this.columns[this.leftCol];
      i && i.modules.vdomHoz.rightPos < this.vDomScrollPosLeft ? (e = !0, this.getVisibleRows().forEach((s) => {
        if (s.type !== "group") {
          var n = s.getCell(i);
          try {
            s.getElement().removeChild(n.getElement());
          } catch (r) {
            console.warn("Could not removeColLeft", r.message);
          }
        }
      }), this.vDomPadLeft += i.getWidth(), this.leftCol++, this.getVisibleRows().forEach((s) => {
        s.type !== "group" && (s.modules.vdomHoz.leftCol = this.leftCol);
      })) : t = !1;
    }
    e && (this.tableElement.style.paddingLeft = this.vDomPadLeft + "px");
  }
  fitDataColActualWidthCheck(e) {
    var t, i;
    return e.modules.vdomHoz.fitDataCheck && (e.reinitializeWidth(), t = e.getWidth(), i = t - e.modules.vdomHoz.width, i && (e.modules.vdomHoz.rightPos += i, e.modules.vdomHoz.width = t, this.colPositionAdjust(this.columns.indexOf(e) + 1, this.columns.length, i)), e.modules.vdomHoz.fitDataCheck = !1), i;
  }
  initializeRow(e) {
    if (e.type !== "group") {
      e.modules.vdomHoz = {
        leftCol: this.leftCol,
        rightCol: this.rightCol
      }, this.table.modules.frozenColumns && this.table.modules.frozenColumns.leftColumns.forEach((t) => {
        this.appendCell(e, t);
      });
      for (let t = this.leftCol; t <= this.rightCol; t++)
        this.appendCell(e, this.columns[t]);
      this.table.modules.frozenColumns && this.table.modules.frozenColumns.rightColumns.forEach((t) => {
        this.appendCell(e, t);
      });
    }
  }
  appendCell(e, t) {
    if (t && t.visible) {
      let i = e.getCell(t);
      e.getElement().appendChild(i.getElement()), i.cellRendered();
    }
  }
  reinitializeRow(e, t) {
    if (e.type !== "group" && (t || !e.modules.vdomHoz || e.modules.vdomHoz.leftCol !== this.leftCol || e.modules.vdomHoz.rightCol !== this.rightCol)) {
      for (var i = e.getElement(); i.firstChild; ) i.removeChild(i.firstChild);
      this.initializeRow(e);
    }
  }
}
class Wr extends ie {
  constructor(e) {
    super(e), this.blockHozScrollEvent = !1, this.headersElement = null, this.contentsElement = null, this.rowHeader = null, this.element = null, this.columns = [], this.columnsByIndex = [], this.columnsByField = {}, this.scrollLeft = 0, this.optionsList = new fs(this.table, "column definition", Ki), this.redrawBlock = !1, this.redrawBlockUpdate = null, this.renderer = null;
  }
  ////////////// Setup Functions /////////////////
  initialize() {
    this.initializeRenderer(), this.headersElement = this.createHeadersElement(), this.contentsElement = this.createHeaderContentsElement(), this.element = this.createHeaderElement(), this.contentsElement.insertBefore(this.headersElement, this.contentsElement.firstChild), this.element.insertBefore(this.contentsElement, this.element.firstChild), this.initializeScrollWheelWatcher(), this.subscribe("scroll-horizontal", this.scrollHorizontal.bind(this)), this.subscribe("scrollbar-vertical", this.padVerticalScrollbar.bind(this));
  }
  padVerticalScrollbar(e) {
    this.table.rtl ? this.headersElement.style.marginLeft = e + "px" : this.headersElement.style.marginRight = e + "px";
  }
  initializeRenderer() {
    var e, t = {
      virtual: Vr,
      basic: Ir
    };
    typeof this.table.options.renderHorizontal == "string" ? e = t[this.table.options.renderHorizontal] : e = this.table.options.renderHorizontal, e ? (this.renderer = new e(this.table, this.element, this.tableElement), this.renderer.initialize()) : console.error("Unable to find matching renderer:", this.table.options.renderHorizontal);
  }
  createHeadersElement() {
    var e = document.createElement("div");
    return e.classList.add("tabulator-headers"), e.setAttribute("role", "row"), e;
  }
  createHeaderContentsElement() {
    var e = document.createElement("div");
    return e.classList.add("tabulator-header-contents"), e;
  }
  createHeaderElement() {
    var e = document.createElement("div");
    return e.classList.add("tabulator-header"), e.setAttribute("role", "rowgroup"), this.table.options.headerVisible || e.classList.add("tabulator-header-hidden"), e;
  }
  //return containing element
  getElement() {
    return this.element;
  }
  //return containing contents element
  getContentsElement() {
    return this.contentsElement;
  }
  //return header containing element
  getHeadersElement() {
    return this.headersElement;
  }
  //scroll horizontally to match table body
  scrollHorizontal(e) {
    this.contentsElement.scrollLeft = e, this.scrollLeft = e, this.renderer.scrollColumns(e);
  }
  initializeScrollWheelWatcher() {
    this.contentsElement.addEventListener("wheel", (e) => {
      var t;
      e.deltaX && (t = this.contentsElement.scrollLeft + e.deltaX, this.table.rowManager.scrollHorizontal(t), this.table.columnManager.scrollHorizontal(t));
    });
  }
  ///////////// Column Setup Functions /////////////
  generateColumnsFromRowData(e) {
    var t = [], i = {}, s = this.table.options.autoColumns === "full" ? e : [e[0]], n = this.table.options.autoColumnsDefinitions;
    if (e && e.length) {
      if (s.forEach((r) => {
        Object.keys(r).forEach((a, l) => {
          let h = r[a], d;
          i[a] ? i[a] !== !0 && typeof h < "u" && (i[a].sorter = this.calculateSorterFromValue(h), i[a] = !0) : (d = {
            field: a,
            title: a,
            sorter: this.calculateSorterFromValue(h)
          }, t.splice(l, 0, d), i[a] = typeof h > "u" ? d : !0);
        });
      }), n)
        switch (typeof n) {
          case "function":
            this.table.options.columns = n.call(this.table, t);
            break;
          case "object":
            Array.isArray(n) ? t.forEach((r) => {
              var a = n.find((l) => l.field === r.field);
              a && Object.assign(r, a);
            }) : t.forEach((r) => {
              n[r.field] && Object.assign(r, n[r.field]);
            }), this.table.options.columns = t;
            break;
        }
      else
        this.table.options.columns = t;
      this.setColumns(this.table.options.columns);
    }
  }
  calculateSorterFromValue(e) {
    var t;
    switch (typeof e) {
      case "undefined":
        t = "string";
        break;
      case "boolean":
        t = "boolean";
        break;
      case "number":
        t = "number";
        break;
      case "object":
        Array.isArray(e) ? t = "array" : t = "string";
        break;
      default:
        !isNaN(Number(e)) && e !== "" ? t = "number" : e.match(/((^[0-9]+[a-z]+)|(^[a-z]+[0-9]+))+$/i) ? t = "alphanum" : t = "string";
        break;
    }
    return t;
  }
  setColumns(e, t) {
    for (; this.headersElement.firstChild; ) this.headersElement.removeChild(this.headersElement.firstChild);
    this.columns = [], this.columnsByIndex = [], this.columnsByField = {}, this.dispatch("columns-loading"), this.dispatchExternal("columnsLoading"), this.table.options.rowHeader && (this.rowHeader = new je(this.table.options.rowHeader === !0 ? {} : this.table.options.rowHeader, this, !0), this.columns.push(this.rowHeader), this.headersElement.appendChild(this.rowHeader.getElement()), this.rowHeader.columnRendered()), e.forEach((i, s) => {
      this._addColumn(i);
    }), this._reIndexColumns(), this.dispatch("columns-loaded"), this.subscribedExternal("columnsLoaded") && this.dispatchExternal("columnsLoaded", this.getComponents()), this.rerenderColumns(!1, !0), this.redraw(!0);
  }
  _addColumn(e, t, i) {
    var s = new je(e, this), n = s.getElement(), r = i && this.findColumnIndex(i);
    if (t && this.rowHeader && (!i || i === this.rowHeader) && (t = !1, i = this.rowHeader, r = 0), i && r > -1) {
      var a = i.getTopColumn(), l = this.columns.indexOf(a), h = a.getElement();
      t ? (this.columns.splice(l, 0, s), h.parentNode.insertBefore(n, h)) : (this.columns.splice(l + 1, 0, s), h.parentNode.insertBefore(n, h.nextSibling));
    } else
      t ? (this.columns.unshift(s), this.headersElement.insertBefore(s.getElement(), this.headersElement.firstChild)) : (this.columns.push(s), this.headersElement.appendChild(s.getElement()));
    return s.columnRendered(), s;
  }
  registerColumnField(e) {
    e.definition.field && (this.columnsByField[e.definition.field] = e);
  }
  registerColumnPosition(e) {
    this.columnsByIndex.push(e);
  }
  _reIndexColumns() {
    this.columnsByIndex = [], this.columns.forEach(function(e) {
      e.reRegisterPosition();
    });
  }
  //ensure column headers take up the correct amount of space in column groups
  verticalAlignHeaders() {
    var e = 0;
    this.redrawBlock || (this.headersElement.style.height = "", this.columns.forEach((t) => {
      t.clearVerticalAlign();
    }), this.columns.forEach((t) => {
      var i = t.getHeight();
      i > e && (e = i);
    }), this.headersElement.style.height = e + "px", this.columns.forEach((t) => {
      t.verticalAlign(this.table.options.columnHeaderVertAlign, e);
    }), this.table.rowManager.adjustTableSize());
  }
  //////////////// Column Details /////////////////
  findColumn(e) {
    var t;
    if (typeof e == "object") {
      if (e instanceof je)
        return e;
      if (e instanceof qi)
        return e._getSelf() || !1;
      if (typeof HTMLElement < "u" && e instanceof HTMLElement)
        return t = [], this.columns.forEach((s) => {
          t.push(s), t = t.concat(s.getColumns(!0));
        }), t.find((s) => s.element === e) || !1;
    } else
      return this.columnsByField[e] || !1;
    return !1;
  }
  getColumnByField(e) {
    return this.columnsByField[e];
  }
  getColumnsByFieldRoot(e) {
    var t = [];
    return Object.keys(this.columnsByField).forEach((i) => {
      var s = this.table.options.nestedFieldSeparator ? i.split(this.table.options.nestedFieldSeparator)[0] : i;
      s === e && t.push(this.columnsByField[i]);
    }), t;
  }
  getColumnByIndex(e) {
    return this.columnsByIndex[e];
  }
  getFirstVisibleColumn() {
    var e = this.columnsByIndex.findIndex((t) => t.visible);
    return e > -1 ? this.columnsByIndex[e] : !1;
  }
  getVisibleColumnsByIndex() {
    return this.columnsByIndex.filter((e) => e.visible);
  }
  getColumns() {
    return this.columns;
  }
  findColumnIndex(e) {
    return this.columnsByIndex.findIndex((t) => e === t);
  }
  //return all columns that are not groups
  getRealColumns() {
    return this.columnsByIndex;
  }
  //traverse across columns and call action
  traverse(e) {
    this.columnsByIndex.forEach((t, i) => {
      e(t, i);
    });
  }
  //get definitions of actual columns
  getDefinitions(e) {
    var t = [];
    return this.columnsByIndex.forEach((i) => {
      (!e || e && i.visible) && t.push(i.getDefinition());
    }), t;
  }
  //get full nested definition tree
  getDefinitionTree() {
    var e = [];
    return this.columns.forEach((t) => {
      e.push(t.getDefinition(!0));
    }), e;
  }
  getComponents(e) {
    var t = [], i = e ? this.columns : this.columnsByIndex;
    return i.forEach((s) => {
      t.push(s.getComponent());
    }), t;
  }
  getWidth() {
    var e = 0;
    return this.columnsByIndex.forEach((t) => {
      t.visible && (e += t.getWidth());
    }), e;
  }
  moveColumn(e, t, i) {
    t.element.parentNode.insertBefore(e.element, t.element), i && t.element.parentNode.insertBefore(t.element, e.element), this.moveColumnActual(e, t, i), this.verticalAlignHeaders(), this.table.rowManager.reinitialize();
  }
  moveColumnActual(e, t, i) {
    e.parent.isGroup ? this._moveColumnInArray(e.parent.columns, e, t, i) : this._moveColumnInArray(this.columns, e, t, i), this._moveColumnInArray(this.columnsByIndex, e, t, i, !0), this.rerenderColumns(!0), this.dispatch("column-moved", e, t, i), this.subscribedExternal("columnMoved") && this.dispatchExternal("columnMoved", e.getComponent(), this.table.columnManager.getComponents());
  }
  _moveColumnInArray(e, t, i, s, n) {
    var r = e.indexOf(t), a, l = [];
    r > -1 && (e.splice(r, 1), a = e.indexOf(i), a > -1 ? s && (a = a + 1) : a = r, e.splice(a, 0, t), n && (l = this.chain("column-moving-rows", [t, i, s], null, []) || [], l = l.concat(this.table.rowManager.rows), l.forEach(function(h) {
      if (h.cells.length) {
        var d = h.cells.splice(r, 1)[0];
        h.cells.splice(a, 0, d);
      }
    })));
  }
  scrollToColumn(e, t, i) {
    var s = 0, n = e.getLeftOffset(), r = 0, a = e.getElement();
    return new Promise((l, h) => {
      if (typeof t > "u" && (t = this.table.options.scrollToColumnPosition), typeof i > "u" && (i = this.table.options.scrollToColumnIfVisible), e.visible) {
        switch (t) {
          case "middle":
          case "center":
            r = -this.element.clientWidth / 2;
            break;
          case "right":
            r = a.clientWidth - this.headersElement.clientWidth;
            break;
        }
        if (!i && n > 0 && n + a.offsetWidth < this.element.clientWidth)
          return !1;
        s = n + r, s = Math.max(Math.min(s, this.table.rowManager.element.scrollWidth - this.table.rowManager.element.clientWidth), 0), this.table.rowManager.scrollHorizontal(s), this.scrollHorizontal(s), l();
      } else
        console.warn("Scroll Error - Column not visible"), h("Scroll Error - Column not visible");
    });
  }
  //////////////// Cell Management /////////////////
  generateCells(e) {
    var t = [];
    return this.columnsByIndex.forEach((i) => {
      t.push(i.generateCell(e));
    }), t;
  }
  //////////////// Column Management /////////////////
  getFlexBaseWidth() {
    var e = this.table.element.clientWidth, t = 0;
    return this.table.rowManager.element.scrollHeight > this.table.rowManager.element.clientHeight && (e -= this.table.rowManager.element.offsetWidth - this.table.rowManager.element.clientWidth), this.columnsByIndex.forEach(function(i) {
      var s, n, r;
      i.visible && (s = i.definition.width || 0, n = parseInt(i.minWidth), typeof s == "string" ? s.indexOf("%") > -1 ? r = e / 100 * parseInt(s) : r = parseInt(s) : r = s, t += r > n ? r : n);
    }), t;
  }
  addColumn(e, t, i) {
    return new Promise((s, n) => {
      var r = this._addColumn(e, t, i);
      this._reIndexColumns(), this.dispatch("column-add", e, t, i), this.layoutMode() != "fitColumns" && r.reinitializeWidth(), this.redraw(!0), this.table.rowManager.reinitialize(), this.rerenderColumns(), s(r);
    });
  }
  //remove column from system
  deregisterColumn(e) {
    var t = e.getField(), i;
    t && delete this.columnsByField[t], i = this.columnsByIndex.indexOf(e), i > -1 && this.columnsByIndex.splice(i, 1), i = this.columns.indexOf(e), i > -1 && this.columns.splice(i, 1), this.verticalAlignHeaders(), this.redraw();
  }
  rerenderColumns(e, t) {
    this.redrawBlock ? (e === !1 || e === !0 && this.redrawBlockUpdate === null) && (this.redrawBlockUpdate = e) : this.renderer.rerenderColumns(e, t);
  }
  blockRedraw() {
    this.redrawBlock = !0, this.redrawBlockUpdate = null;
  }
  restoreRedraw() {
    this.redrawBlock = !1, this.verticalAlignHeaders(), this.renderer.rerenderColumns(this.redrawBlockUpdate);
  }
  //redraw columns
  redraw(e) {
    K.elVisible(this.element) && this.verticalAlignHeaders(), e && (this.table.rowManager.resetScroll(), this.table.rowManager.reinitialize()), this.confirm("table-redrawing", e) || this.layoutRefresh(e), this.dispatch("table-redraw", e), this.table.footerManager.redraw();
  }
}
class jr extends Lt {
  constructor(e) {
    super(e), this.verticalFillMode = "fill", this.scrollTop = 0, this.scrollLeft = 0, this.scrollTop = 0, this.scrollLeft = 0;
  }
  clearRows() {
    for (var e = this.tableElement; e.firstChild; ) e.removeChild(e.firstChild);
    e.scrollTop = 0, e.scrollLeft = 0, e.style.minWidth = "", e.style.minHeight = "", e.style.display = "", e.style.visibility = "";
  }
  renderRows() {
    var e = this.tableElement, t = !0, i = document.createDocumentFragment(), s = this.rows();
    s.forEach((n, r) => {
      this.styleRow(n, r), n.initialize(!1, !0), n.type !== "group" && (t = !1), i.appendChild(n.getElement());
    }), e.appendChild(i), s.forEach((n) => {
      n.rendered(), n.heightInitialized || n.calcHeight(!0);
    }), s.forEach((n) => {
      n.heightInitialized || n.setCellHeight();
    }), t ? e.style.minWidth = this.table.columnManager.getWidth() + "px" : e.style.minWidth = "";
  }
  rerenderRows(e) {
    let t = this.elementVertical.scrollTop;
    this.clearRows(), e && e(), this.renderRows(), this.rows().length ? this.elementVertical.scrollTop = t : this.table.rowManager.tableEmpty();
  }
  scrollToRowNearestTop(e) {
    var t = K.elOffset(e.getElement()).top;
    return !(Math.abs(this.elementVertical.scrollTop - t) > Math.abs(this.elementVertical.scrollTop + this.elementVertical.clientHeight - t));
  }
  scrollToRow(e) {
    var t = e.getElement();
    this.elementVertical.scrollTop = K.elOffset(t).top - K.elOffset(this.elementVertical).top + this.elementVertical.scrollTop;
  }
  visibleRows(e) {
    return this.rows();
  }
}
class Gr extends Lt {
  constructor(e) {
    super(e), this.verticalFillMode = "fill", this.scrollTop = 0, this.scrollLeft = 0, this.vDomRowHeight = 20, this.vDomTop = 0, this.vDomBottom = 0, this.vDomScrollPosTop = 0, this.vDomScrollPosBottom = 0, this.vDomTopPad = 0, this.vDomBottomPad = 0, this.vDomMaxRenderChain = 90, this.vDomWindowBuffer = 0, this.vDomWindowMinTotalRows = 20, this.vDomWindowMinMarginRows = 5, this.vDomTopNewRows = [], this.vDomBottomNewRows = [];
  }
  //////////////////////////////////////
  ///////// Public Functions ///////////
  //////////////////////////////////////
  clearRows() {
    for (var e = this.tableElement; e.firstChild; ) e.removeChild(e.firstChild);
    e.style.paddingTop = "", e.style.paddingBottom = "", e.style.minHeight = "", e.style.display = "", e.style.visibility = "", this.elementVertical.scrollTop = 0, this.elementVertical.scrollLeft = 0, this.scrollTop = 0, this.scrollLeft = 0, this.vDomTop = 0, this.vDomBottom = 0, this.vDomTopPad = 0, this.vDomBottomPad = 0, this.vDomScrollPosTop = 0, this.vDomScrollPosBottom = 0;
  }
  renderRows() {
    this._virtualRenderFill();
  }
  rerenderRows(e) {
    for (var t = this.elementVertical.scrollTop, i = !1, s = !1, n = this.table.rowManager.scrollLeft, r = this.rows(), a = this.vDomTop; a <= this.vDomBottom; a++)
      if (r[a]) {
        var l = t - r[a].getElement().offsetTop;
        if (s === !1 || Math.abs(l) < s)
          s = l, i = a;
        else
          break;
      }
    r.forEach((h) => {
      h.deinitializeHeight();
    }), e && e(), this.rows().length ? (i === !1 && (i = r.length ? this.rows().length - 1 : 0), this._virtualRenderFill(i, !0, s || 0)) : (this.clear(), this.table.rowManager.tableEmpty()), this.scrollColumns(n);
  }
  scrollColumns(e) {
    this.table.rowManager.scrollHorizontal(e);
  }
  scrollRows(e, t) {
    var i = e - this.vDomScrollPosTop, s = e - this.vDomScrollPosBottom, n = this.vDomWindowBuffer * 2, r = this.rows();
    if (this.scrollTop = e, -i > n || s > n) {
      var a = this.table.rowManager.scrollLeft;
      this._virtualRenderFill(Math.floor(this.elementVertical.scrollTop / this.elementVertical.scrollHeight * r.length)), this.scrollColumns(a);
    } else
      t ? (i < 0 && this._addTopRow(r, -i), s < 0 && (this.vDomScrollHeight - this.scrollTop > this.vDomWindowBuffer ? this._removeBottomRow(r, -s) : this.vDomScrollPosBottom = this.scrollTop)) : (s >= 0 && this._addBottomRow(r, s), i >= 0 && (this.scrollTop > this.vDomWindowBuffer ? this._removeTopRow(r, i) : this.vDomScrollPosTop = this.scrollTop));
  }
  resize() {
    this.vDomWindowBuffer = this.table.options.renderVerticalBuffer || this.elementVertical.clientHeight;
  }
  scrollToRowNearestTop(e) {
    var t = this.rows().indexOf(e);
    return !(Math.abs(this.vDomTop - t) > Math.abs(this.vDomBottom - t));
  }
  scrollToRow(e) {
    var t = this.rows().indexOf(e);
    t > -1 && this._virtualRenderFill(t, !0);
  }
  visibleRows(e) {
    var t = this.elementVertical.scrollTop, i = this.elementVertical.clientHeight + t, s = !1, n = 0, r = 0, a = this.rows();
    if (e)
      n = this.vDomTop, r = this.vDomBottom;
    else
      for (var l = this.vDomTop; l <= this.vDomBottom; l++)
        if (a[l])
          if (s)
            if (i - a[l].getElement().offsetTop >= 0)
              r = l;
            else
              break;
          else if (t - a[l].getElement().offsetTop >= 0)
            n = l;
          else if (s = !0, i - a[l].getElement().offsetTop >= 0)
            r = l;
          else
            break;
    return a.slice(n, r + 1);
  }
  //////////////////////////////////////
  //////// Internal Rendering //////////
  //////////////////////////////////////
  //full virtual render
  _virtualRenderFill(e, t, i) {
    var s = this.tableElement, n = this.elementVertical, r = 0, a = 0, l = 0, h = 0, d = 0, c = 0, u = this.rows(), f = u.length, m = 0, p, v, b = [], k = 0, S = 0, F = this.table.rowManager.fixedHeight, _ = this.elementVertical.clientHeight, j = this.table.options.rowHeight, J = !0;
    if (e = e || 0, i = i || 0, !e)
      this.clear();
    else {
      for (; s.firstChild; ) s.removeChild(s.firstChild);
      h = (f - e + 1) * this.vDomRowHeight, h < _ && (e -= Math.ceil((_ - h) / this.vDomRowHeight), e < 0 && (e = 0)), r = Math.min(Math.max(Math.floor(this.vDomWindowBuffer / this.vDomRowHeight), this.vDomWindowMinMarginRows), e), e -= r;
    }
    if (f && K.elVisible(this.elementVertical)) {
      for (this.vDomTop = e, this.vDomBottom = e - 1, F || this.table.options.maxHeight ? (j && (S = _ / j + this.vDomWindowBuffer / j), S = Math.max(this.vDomWindowMinTotalRows, Math.ceil(S))) : S = f; (S == f || a <= _ + this.vDomWindowBuffer || k < this.vDomWindowMinTotalRows) && this.vDomBottom < f - 1; ) {
        for (b = [], v = document.createDocumentFragment(), c = 0; c < S && this.vDomBottom < f - 1; )
          m = this.vDomBottom + 1, p = u[m], this.styleRow(p, m), p.initialize(!1, !0), !p.heightInitialized && !this.table.options.rowHeight && p.clearCellHeight(), v.appendChild(p.getElement()), b.push(p), this.vDomBottom++, c++;
        if (!b.length)
          break;
        s.appendChild(v), b.forEach(($) => {
          $.rendered();
        });
        const U = [];
        b.forEach(($) => {
          (!$.heightInitialized || !$.getHeight()) && ($.calcHeight(!0), U.push($));
        }), U.forEach(($) => {
          $.setCellHeight();
        }), b.forEach(($) => {
          l = $.getHeight() || this.vDomRowHeight, k < r ? d += l : a += l, l > this.vDomWindowBuffer && (this.vDomWindowBuffer = l * 2), k++;
        }), J = this.table.rowManager.adjustTableSize(!0), _ = this.elementVertical.clientHeight, J && (F || this.table.options.maxHeight) && (j = a / k, S = Math.max(this.vDomWindowMinTotalRows, Math.ceil(_ / j + this.vDomWindowBuffer / j)));
      }
      e ? (this.vDomTopPad = t ? this.vDomRowHeight * this.vDomTop + i : this.scrollTop - d, this.vDomBottomPad = this.vDomBottom == f - 1 ? 0 : Math.max(this.vDomScrollHeight - this.vDomTopPad - a - d, 0)) : (this.vDomTopPad = 0, this.vDomRowHeight = Math.floor((a + d) / k), this.vDomBottomPad = this.vDomRowHeight * (f - this.vDomBottom - 1), this.vDomScrollHeight = d + a + this.vDomBottomPad - _), s.style.paddingTop = this.vDomTopPad + "px", s.style.paddingBottom = this.vDomBottomPad + "px", t && (this.scrollTop = this.vDomTopPad + d + i - (this.elementVertical.scrollWidth > this.elementVertical.clientWidth ? this.elementVertical.offsetHeight - _ : 0)), this.scrollTop = Math.min(this.scrollTop, this.elementVertical.scrollHeight - _), this.elementVertical.scrollWidth > this.elementVertical.clientWidth && t && (this.scrollTop += this.elementVertical.offsetHeight - _), this.vDomScrollPosTop = this.scrollTop, this.vDomScrollPosBottom = this.scrollTop, n.scrollTop = this.scrollTop, this.dispatch("render-virtual-fill");
    }
  }
  _addTopRow(e, t) {
    for (var i = this.tableElement, s = [], n = 0, r = this.vDomTop - 1, a = 0, l = !0; l; )
      if (this.vDomTop) {
        let h = e[r], d, c;
        h && a < this.vDomMaxRenderChain ? (d = h.getHeight() || this.vDomRowHeight, c = h.initialized, t >= d ? (this.styleRow(h, r), i.insertBefore(h.getElement(), i.firstChild), (!h.initialized || !h.heightInitialized) && s.push(h), h.initialize(), c || (d = h.getElement().offsetHeight, d > this.vDomWindowBuffer && (this.vDomWindowBuffer = d * 2)), t -= d, n += d, this.vDomTop--, r--, a++) : l = !1) : l = !1;
      } else
        l = !1;
    for (let h of s)
      h.clearCellHeight();
    this._quickNormalizeRowHeight(s), n && (this.vDomTopPad -= n, this.vDomTopPad < 0 && (this.vDomTopPad = r * this.vDomRowHeight), r < 1 && (this.vDomTopPad = 0), i.style.paddingTop = this.vDomTopPad + "px", this.vDomScrollPosTop -= n);
  }
  _removeTopRow(e, t) {
    for (var i = [], s = 0, n = 0, r = !0; r; ) {
      let a = e[this.vDomTop], l;
      a && n < this.vDomMaxRenderChain ? (l = a.getHeight() || this.vDomRowHeight, t >= l ? (this.vDomTop++, t -= l, s += l, i.push(a), n++) : r = !1) : r = !1;
    }
    for (let a of i) {
      let l = a.getElement();
      l.parentNode && l.parentNode.removeChild(l);
    }
    s && (this.vDomTopPad += s, this.tableElement.style.paddingTop = this.vDomTopPad + "px", this.vDomScrollPosTop += this.vDomTop ? s : s + this.vDomWindowBuffer);
  }
  _addBottomRow(e, t) {
    for (var i = this.tableElement, s = [], n = 0, r = this.vDomBottom + 1, a = 0, l = !0; l; ) {
      let h = e[r], d, c;
      h && a < this.vDomMaxRenderChain ? (d = h.getHeight() || this.vDomRowHeight, c = h.initialized, t >= d ? (this.styleRow(h, r), i.appendChild(h.getElement()), (!h.initialized || !h.heightInitialized) && s.push(h), h.initialize(), c || (d = h.getElement().offsetHeight, d > this.vDomWindowBuffer && (this.vDomWindowBuffer = d * 2)), t -= d, n += d, this.vDomBottom++, r++, a++) : l = !1) : l = !1;
    }
    for (let h of s)
      h.clearCellHeight();
    this._quickNormalizeRowHeight(s), n && (this.vDomBottomPad -= n, (this.vDomBottomPad < 0 || r == e.length - 1) && (this.vDomBottomPad = 0), i.style.paddingBottom = this.vDomBottomPad + "px", this.vDomScrollPosBottom += n);
  }
  _removeBottomRow(e, t) {
    for (var i = [], s = 0, n = 0, r = !0; r; ) {
      let a = e[this.vDomBottom], l;
      a && n < this.vDomMaxRenderChain ? (l = a.getHeight() || this.vDomRowHeight, t >= l ? (this.vDomBottom--, t -= l, s += l, i.push(a), n++) : r = !1) : r = !1;
    }
    for (let a of i) {
      let l = a.getElement();
      l.parentNode && l.parentNode.removeChild(l);
    }
    s && (this.vDomBottomPad += s, this.vDomBottomPad < 0 && (this.vDomBottomPad = 0), this.tableElement.style.paddingBottom = this.vDomBottomPad + "px", this.vDomScrollPosBottom -= s);
  }
  _quickNormalizeRowHeight(e) {
    for (let t of e)
      t.calcHeight();
    for (let t of e)
      t.setCellHeight();
  }
}
class Ur extends ie {
  constructor(e) {
    super(e), this.element = this.createHolderElement(), this.tableElement = this.createTableElement(), this.heightFixer = this.createTableElement(), this.placeholder = null, this.placeholderContents = null, this.firstRender = !1, this.renderMode = "virtual", this.fixedHeight = !1, this.rows = [], this.activeRowsPipeline = [], this.activeRows = [], this.activeRowsCount = 0, this.displayRows = [], this.displayRowsCount = 0, this.scrollTop = 0, this.scrollLeft = 0, this.redrawBlock = !1, this.redrawBlockRestoreConfig = !1, this.redrawBlockRenderInPosition = !1, this.dataPipeline = [], this.displayPipeline = [], this.scrollbarWidth = 0, this.renderer = null;
  }
  //////////////// Setup Functions /////////////////
  createHolderElement() {
    var e = document.createElement("div");
    return e.classList.add("tabulator-tableholder"), e.setAttribute("tabindex", 0), e;
  }
  createTableElement() {
    var e = document.createElement("div");
    return e.classList.add("tabulator-table"), e.setAttribute("role", "rowgroup"), e.setAttribute("id", "tabulator-table-body-" + this.table.instanceId), e;
  }
  initializePlaceholder() {
    var e = this.table.options.placeholder;
    if (typeof e == "function" && (e = e.call(this.table)), e = this.chain("placeholder", [e], e, e) || e, e) {
      let t = document.createElement("div");
      if (t.classList.add("tabulator-placeholder"), typeof e == "string") {
        let i = document.createElement("div");
        i.classList.add("tabulator-placeholder-contents"), i.innerHTML = e, t.appendChild(i), this.placeholderContents = i;
      } else typeof HTMLElement < "u" && e instanceof HTMLElement ? (t.appendChild(e), this.placeholderContents = e) : (console.warn("Invalid placeholder provided, must be string or HTML Element", e), this.el = null);
      this.placeholder = t;
    }
  }
  //return containing element
  getElement() {
    return this.element;
  }
  //return table element
  getTableElement() {
    return this.tableElement;
  }
  initialize() {
    this.initializePlaceholder(), this.initializeRenderer(), this.element.appendChild(this.tableElement), this.firstRender = !0, this.element.addEventListener("scroll", () => {
      var e = this.element.scrollLeft, t = this.scrollLeft > e, i = this.element.scrollTop, s = this.scrollTop > i;
      this.scrollLeft != e && (this.scrollLeft = e, this.dispatch("scroll-horizontal", e, t), this.dispatchExternal("scrollHorizontal", e, t), this._positionPlaceholder()), this.scrollTop != i && (this.scrollTop = i, this.renderer.scrollRows(i, s), this.dispatch("scroll-vertical", i, s), this.dispatchExternal("scrollVertical", i, s));
    });
  }
  ////////////////// Row Manipulation //////////////////
  findRow(e) {
    if (typeof e == "object") {
      if (e instanceof te)
        return e;
      if (e instanceof Tt)
        return e._getSelf() || !1;
      if (typeof HTMLElement < "u" && e instanceof HTMLElement)
        return this.rows.find((i) => i.getElement() === e) || !1;
      if (e === null)
        return !1;
    } else return typeof e > "u" ? !1 : this.rows.find((i) => i.data[this.table.options.index] == e) || !1;
    return !1;
  }
  getRowFromDataObject(e) {
    var t = this.rows.find((i) => i.data === e);
    return t || !1;
  }
  getRowFromPosition(e) {
    return this.getDisplayRows().find((t) => t.type === "row" && t.getPosition() === e && t.isDisplayed());
  }
  scrollToRow(e, t, i) {
    return this.renderer.scrollToRowPosition(e, t, i);
  }
  ////////////////// Data Handling //////////////////
  setData(e, t, i) {
    return new Promise((s, n) => {
      t && this.getDisplayRows().length ? this.table.options.pagination ? this._setDataActual(e, !0) : this.reRenderInPosition(() => {
        this._setDataActual(e);
      }) : (this.table.options.autoColumns && i && this.table.initialized && this.table.columnManager.generateColumnsFromRowData(e), this.resetScroll(), this._setDataActual(e)), s();
    });
  }
  _setDataActual(e, t) {
    this.dispatchExternal("dataProcessing", e), this._wipeElements(), Array.isArray(e) ? (this.dispatch("data-processing", e), e.forEach((i, s) => {
      if (i && typeof i == "object") {
        var n = new te(i, this);
        this.rows.push(n);
      } else
        console.warn("Data Loading Warning - Invalid row data detected and ignored, expecting object but received:", i);
    }), this.refreshActiveData(!1, !1, t), this.dispatch("data-processed", e), this.dispatchExternal("dataProcessed", e)) : console.error(`Data Loading Error - Unable to process data due to invalid data type 
Expecting: array 
Received: `, typeof e, `
Data:     `, e);
  }
  _wipeElements() {
    this.dispatch("rows-wipe"), this.destroy(), this.adjustTableSize(), this.dispatch("rows-wiped");
  }
  destroy() {
    this.rows.forEach((e) => {
      e.wipe();
    }), this.rows = [], this.activeRows = [], this.activeRowsPipeline = [], this.activeRowsCount = 0, this.displayRows = [], this.displayRowsCount = 0;
  }
  deleteRow(e, t) {
    var i = this.rows.indexOf(e), s = this.activeRows.indexOf(e);
    s > -1 && this.activeRows.splice(s, 1), i > -1 && this.rows.splice(i, 1), this.setActiveRows(this.activeRows), this.displayRowIterator((n) => {
      var r = n.indexOf(e);
      r > -1 && n.splice(r, 1);
    }), t || this.reRenderInPosition(), this.regenerateRowPositions(), this.dispatchExternal("rowDeleted", e.getComponent()), this.displayRowsCount || this.tableEmpty(), this.subscribedExternal("dataChanged") && this.dispatchExternal("dataChanged", this.getData());
  }
  addRow(e, t, i, s) {
    var n = this.addRowActual(e, t, i, s);
    return n;
  }
  //add multiple rows
  addRows(e, t, i, s) {
    var n = [];
    return new Promise((r, a) => {
      t = this.findAddRowPos(t), Array.isArray(e) || (e = [e]), (typeof i > "u" && t || typeof i < "u" && !t) && e.reverse(), e.forEach((l, h) => {
        var d = this.addRow(l, t, i, !0);
        n.push(d), this.dispatch("row-added", d, l, t, i);
      }), this.refreshActiveData(s ? "displayPipeline" : !1, !1, !0), this.regenerateRowPositions(), this.displayRowsCount && this._clearPlaceholder(), r(n);
    });
  }
  findAddRowPos(e) {
    return typeof e > "u" && (e = this.table.options.addRowPos), e === "pos" && (e = !0), e === "bottom" && (e = !1), e;
  }
  addRowActual(e, t, i, s) {
    var n = e instanceof te ? e : new te(e || {}, this), r = this.findAddRowPos(t), a = -1, l, h;
    return i || (h = this.chain("row-adding-position", [n, r], null, { index: i, top: r }), i = h.index, r = h.top), typeof i < "u" && (i = this.findRow(i)), i = this.chain("row-adding-index", [n, i, r], null, i), i && (a = this.rows.indexOf(i)), i && a > -1 ? (l = this.activeRows.indexOf(i), this.displayRowIterator(function(d) {
      var c = d.indexOf(i);
      c > -1 && d.splice(r ? c : c + 1, 0, n);
    }), l > -1 && this.activeRows.splice(r ? l : l + 1, 0, n), this.rows.splice(r ? a : a + 1, 0, n)) : r ? (this.displayRowIterator(function(d) {
      d.unshift(n);
    }), this.activeRows.unshift(n), this.rows.unshift(n)) : (this.displayRowIterator(function(d) {
      d.push(n);
    }), this.activeRows.push(n), this.rows.push(n)), this.setActiveRows(this.activeRows), this.dispatchExternal("rowAdded", n.getComponent()), this.subscribedExternal("dataChanged") && this.dispatchExternal("dataChanged", this.table.rowManager.getData()), s || this.reRenderInPosition(), n;
  }
  moveRow(e, t, i) {
    this.dispatch("row-move", e, t, i), this.moveRowActual(e, t, i), this.regenerateRowPositions(), this.dispatch("row-moved", e, t, i), this.dispatchExternal("rowMoved", e.getComponent());
  }
  moveRowActual(e, t, i) {
    this.moveRowInArray(this.rows, e, t, i), this.moveRowInArray(this.activeRows, e, t, i), this.displayRowIterator((s) => {
      this.moveRowInArray(s, e, t, i);
    }), this.dispatch("row-moving", e, t, i);
  }
  moveRowInArray(e, t, i, s) {
    var n, r, a, l;
    if (t !== i && (n = e.indexOf(t), n > -1 && (e.splice(n, 1), r = e.indexOf(i), r > -1 ? s ? e.splice(r + 1, 0, t) : e.splice(r, 0, t) : e.splice(n, 0, t)), e === this.getDisplayRows())) {
      a = n < r ? n : r, l = r > n ? r : n + 1;
      for (let h = a; h <= l; h++)
        e[h] && this.styleRow(e[h], h);
    }
  }
  clearData() {
    this.setData([]);
  }
  getRowIndex(e) {
    return this.findRowIndex(e, this.rows);
  }
  getDisplayRowIndex(e) {
    var t = this.getDisplayRows().indexOf(e);
    return t > -1 ? t : !1;
  }
  nextDisplayRow(e, t) {
    var i = this.getDisplayRowIndex(e), s = !1;
    return i !== !1 && i < this.displayRowsCount - 1 && (s = this.getDisplayRows()[i + 1]), s && (!(s instanceof te) || s.type != "row") ? this.nextDisplayRow(s, t) : s;
  }
  prevDisplayRow(e, t) {
    var i = this.getDisplayRowIndex(e), s = !1;
    return i && (s = this.getDisplayRows()[i - 1]), t && s && (!(s instanceof te) || s.type != "row") ? this.prevDisplayRow(s, t) : s;
  }
  findRowIndex(e, t) {
    var i;
    return e = this.findRow(e), e && (i = t.indexOf(e), i > -1) ? i : !1;
  }
  getData(e, t) {
    var i = [], s = this.getRows(e);
    return s.forEach(function(n) {
      n.type == "row" && i.push(n.getData(t || "data"));
    }), i;
  }
  getComponents(e) {
    var t = [], i = this.getRows(e);
    return i.forEach(function(s) {
      t.push(s.getComponent());
    }), t;
  }
  getDataCount(e) {
    var t = this.getRows(e);
    return t.length;
  }
  scrollHorizontal(e) {
    this.scrollLeft = e, this.element.scrollLeft = e, this.dispatch("scroll-horizontal", e);
  }
  registerDataPipelineHandler(e, t) {
    typeof t < "u" ? (this.dataPipeline.push({ handler: e, priority: t }), this.dataPipeline.sort((i, s) => i.priority - s.priority)) : console.error("Data pipeline handlers must have a priority in order to be registered");
  }
  registerDisplayPipelineHandler(e, t) {
    typeof t < "u" ? (this.displayPipeline.push({ handler: e, priority: t }), this.displayPipeline.sort((i, s) => i.priority - s.priority)) : console.error("Display pipeline handlers must have a priority in order to be registered");
  }
  //set active data set
  refreshActiveData(e, t, i) {
    var s = this.table, n = "", r = 0, a = ["all", "dataPipeline", "display", "displayPipeline", "end"];
    if (!this.table.destroyed) {
      if (typeof e == "function")
        if (r = this.dataPipeline.findIndex((l) => l.handler === e), r > -1)
          n = "dataPipeline", t && (r == this.dataPipeline.length - 1 ? n = "display" : r++);
        else if (r = this.displayPipeline.findIndex((l) => l.handler === e), r > -1)
          n = "displayPipeline", t && (r == this.displayPipeline.length - 1 ? n = "end" : r++);
        else {
          console.error("Unable to refresh data, invalid handler provided", e);
          return;
        }
      else
        n = e || "all", r = 0;
      if (this.redrawBlock) {
        (!this.redrawBlockRestoreConfig || this.redrawBlockRestoreConfig && (this.redrawBlockRestoreConfig.stage === n && r < this.redrawBlockRestoreConfig.index || a.indexOf(n) < a.indexOf(this.redrawBlockRestoreConfig.stage))) && (this.redrawBlockRestoreConfig = {
          handler: e,
          skipStage: t,
          renderInPosition: i,
          stage: n,
          index: r
        });
        return;
      } else
        K.elVisible(this.element) ? i ? this.reRenderInPosition(this.refreshPipelines.bind(this, e, n, r, i)) : (this.refreshPipelines(e, n, r, i), e || this.table.columnManager.renderer.renderColumns(), this.renderTable(), s.options.layoutColumnsOnNewData && this.table.columnManager.redraw(!0)) : this.refreshPipelines(e, n, r, i), this.dispatch("data-refreshed");
    }
  }
  refreshPipelines(e, t, i, s) {
    switch (this.dispatch("data-refreshing"), (!e || !this.activeRowsPipeline[0]) && (this.activeRowsPipeline[0] = this.rows.slice(0)), t) {
      case "all":
      //handle case where all data needs refreshing
      case "dataPipeline":
        for (let n = i; n < this.dataPipeline.length; n++) {
          let r = this.dataPipeline[n].handler(this.activeRowsPipeline[n].slice(0));
          this.activeRowsPipeline[n + 1] = r || this.activeRowsPipeline[n].slice(0);
        }
        this.setActiveRows(this.activeRowsPipeline[this.dataPipeline.length]);
      case "display":
        i = 0, this.resetDisplayRows();
      case "displayPipeline":
        for (let n = i; n < this.displayPipeline.length; n++) {
          let r = this.displayPipeline[n].handler((n ? this.getDisplayRows(n - 1) : this.activeRows).slice(0), s);
          this.setDisplayRows(r || this.getDisplayRows(n - 1).slice(0), n);
        }
      case "end":
        this.regenerateRowPositions();
    }
    this.getDisplayRows().length && this._clearPlaceholder();
  }
  //regenerate row positions
  regenerateRowPositions() {
    var e = this.getDisplayRows(), t = 1;
    e.forEach((i) => {
      i.type === "row" && (i.setPosition(t), t++);
    });
  }
  setActiveRows(e) {
    this.activeRows = e.slice(), this.activeRowsCount = this.activeRows.length;
  }
  //reset display rows array
  resetDisplayRows() {
    this.displayRows = [], this.displayRows.push(this.activeRows.slice(0)), this.displayRowsCount = this.displayRows[0].length;
  }
  //set display row pipeline data
  setDisplayRows(e, t) {
    this.displayRows[t] = e, t == this.displayRows.length - 1 && (this.displayRowsCount = this.displayRows[this.displayRows.length - 1].length);
  }
  getDisplayRows(e) {
    return typeof e > "u" ? this.displayRows.length ? this.displayRows[this.displayRows.length - 1] : [] : this.displayRows[e] || [];
  }
  getVisibleRows(e, t) {
    var i = Object.assign([], this.renderer.visibleRows(!t));
    return e && (i = this.chain("rows-visible", [t], i, i)), i;
  }
  //repeat action across display rows
  displayRowIterator(e) {
    this.activeRowsPipeline.forEach(e), this.displayRows.forEach(e), this.displayRowsCount = this.displayRows[this.displayRows.length - 1].length;
  }
  //return only actual rows (not group headers etc)
  getRows(e) {
    var t = [];
    switch (e) {
      case "active":
        t = this.activeRows;
        break;
      case "display":
        t = this.table.rowManager.getDisplayRows();
        break;
      case "visible":
        t = this.getVisibleRows(!1, !0);
        break;
      default:
        t = this.chain("rows-retrieve", e, null, this.rows) || this.rows;
    }
    return t;
  }
  ///////////////// Table Rendering /////////////////
  //trigger rerender of table in current position
  reRenderInPosition(e) {
    this.redrawBlock ? e ? e() : this.redrawBlockRenderInPosition = !0 : (this.dispatchExternal("renderStarted"), this.renderer.rerenderRows(e), this.fixedHeight || this.adjustTableSize(), this.scrollBarCheck(), this.dispatchExternal("renderComplete"));
  }
  scrollBarCheck() {
    var e = 0;
    this.element.scrollHeight > this.element.clientHeight && (e = this.element.offsetWidth - this.element.clientWidth), e !== this.scrollbarWidth && (this.scrollbarWidth = e, this.dispatch("scrollbar-vertical", e));
  }
  initializeRenderer() {
    var e, t = {
      virtual: Gr,
      basic: jr
    };
    typeof this.table.options.renderVertical == "string" ? e = t[this.table.options.renderVertical] : e = this.table.options.renderVertical, e ? (this.renderMode = this.table.options.renderVertical, this.renderer = new e(this.table, this.element, this.tableElement), this.renderer.initialize(), (this.table.element.clientHeight || this.table.options.height) && !(this.table.options.minHeight && this.table.options.maxHeight) ? this.fixedHeight = !0 : this.fixedHeight = !1) : console.error("Unable to find matching renderer:", this.table.options.renderVertical);
  }
  getRenderMode() {
    return this.renderMode;
  }
  renderTable() {
    this.dispatchExternal("renderStarted"), this.element.scrollTop = 0, this._clearTable(), this.displayRowsCount ? (this.renderer.renderRows(), this.firstRender && (this.firstRender = !1, this.fixedHeight || this.adjustTableSize(), this.layoutRefresh(!0))) : this.renderEmptyScroll(), this.fixedHeight || this.adjustTableSize(), this.dispatch("table-layout"), this.displayRowsCount || this._showPlaceholder(), this.scrollBarCheck(), this.dispatchExternal("renderComplete");
  }
  //show scrollbars on empty table div
  renderEmptyScroll() {
    this.placeholder ? this.tableElement.style.display = "none" : this.tableElement.style.minWidth = this.table.columnManager.getWidth() + "px";
  }
  _clearTable() {
    this._clearPlaceholder(), this.scrollTop = 0, this.scrollLeft = 0, this.renderer.clearRows();
  }
  tableEmpty() {
    this.renderEmptyScroll(), this._showPlaceholder();
  }
  checkPlaceholder() {
    this.displayRowsCount ? this._clearPlaceholder() : this.tableEmpty();
  }
  _showPlaceholder() {
    this.placeholder && (this.placeholder && this.placeholder.parentNode && this.placeholder.parentNode.removeChild(this.placeholder), this.initializePlaceholder(), this.placeholder.setAttribute("tabulator-render-mode", this.renderMode), this.getElement().appendChild(this.placeholder), this._positionPlaceholder(), this.adjustTableSize());
  }
  _clearPlaceholder() {
    this.placeholder && this.placeholder.parentNode && this.placeholder.parentNode.removeChild(this.placeholder), this.tableElement.style.minWidth = "", this.tableElement.style.display = "";
  }
  _positionPlaceholder() {
    this.placeholder && this.placeholder.parentNode && (this.placeholder.style.width = this.table.columnManager.getWidth() + "px", this.placeholderContents.style.width = this.table.rowManager.element.clientWidth + "px", this.placeholderContents.style.marginLeft = this.scrollLeft + "px");
  }
  styleRow(e, t) {
    var i = e.getElement();
    t % 2 ? (i.classList.add("tabulator-row-even"), i.classList.remove("tabulator-row-odd")) : (i.classList.add("tabulator-row-odd"), i.classList.remove("tabulator-row-even"));
  }
  //normalize height of active rows
  normalizeHeight(e) {
    this.activeRows.forEach(function(t) {
      t.normalizeHeight(e);
    });
  }
  //adjust the height of the table holder to fit in the Tabulator element
  adjustTableSize(e) {
    let t = this.element.clientHeight, i, s = !1;
    if (this.renderer.verticalFillMode === "fill") {
      let n = Math.floor(this.table.columnManager.getElement().getBoundingClientRect().height + (this.table.footerManager && this.table.footerManager.active && !this.table.footerManager.external ? this.table.footerManager.getElement().getBoundingClientRect().height : 0));
      if (this.fixedHeight) {
        i = isNaN(this.table.options.minHeight) ? this.table.options.minHeight : this.table.options.minHeight + "px";
        const r = "calc(100% - " + n + "px)";
        this.element.style.minHeight = i || "calc(100% - " + n + "px)", this.element.style.height = r, this.element.style.maxHeight = r;
      } else
        this.element.style.height = "", this.element.style.height = Math.max(this.table.element.clientHeight - n, 0) + "px", this.element.scrollTop = this.scrollTop;
      this.renderer.resize(), !this.fixedHeight && t != this.element.clientHeight && (s = !0, !e && !this.redrawing && (this.redrawing = !0, this.subscribed("table-resize") ? this.dispatch("table-resize") : this.redraw(), this.redrawing = !1)), this.scrollBarCheck();
    }
    return this._positionPlaceholder(), s;
  }
  //reinitialize all rows
  reinitialize() {
    this.rows.forEach(function(e) {
      e.reinitialize(!0);
    });
  }
  //prevent table from being redrawn
  blockRedraw() {
    this.redrawBlock = !0, this.redrawBlockRestoreConfig = !1;
  }
  //restore table redrawing
  restoreRedraw() {
    this.redrawBlock = !1, this.redrawBlockRestoreConfig ? (this.refreshActiveData(this.redrawBlockRestoreConfig.handler, this.redrawBlockRestoreConfig.skipStage, this.redrawBlockRestoreConfig.renderInPosition), this.redrawBlockRestoreConfig = !1) : this.redrawBlockRenderInPosition && this.reRenderInPosition(), this.redrawBlockRenderInPosition = !1;
  }
  //redraw table
  redraw(e) {
    this.adjustTableSize(), this.table.tableWidth = this.table.element.clientWidth, e ? this.renderTable() : (this.reRenderInPosition(), this.scrollHorizontal(this.scrollLeft));
  }
  resetScroll() {
    if (this.element.scrollLeft = 0, this.element.scrollTop = 0, this.table.browser === "ie") {
      var e = document.createEvent("Event");
      e.initEvent("scroll", !1, !0), this.element.dispatchEvent(e);
    } else
      this.element.dispatchEvent(new Event("scroll"));
  }
}
class $r extends ie {
  constructor(e) {
    super(e), this.active = !1, this.element = this.createElement(), this.containerElement = this.createContainerElement(), this.external = !1;
  }
  initialize() {
    this.initializeElement();
  }
  createElement() {
    var e = document.createElement("div");
    return e.classList.add("tabulator-footer"), e;
  }
  createContainerElement() {
    var e = document.createElement("div");
    return e.classList.add("tabulator-footer-contents"), this.element.appendChild(e), e;
  }
  initializeElement() {
    if (this.table.options.footerElement)
      switch (typeof this.table.options.footerElement) {
        case "string":
          this.table.options.footerElement[0] === "<" ? this.containerElement.innerHTML = this.table.options.footerElement : (this.external = !0, this.containerElement = document.querySelector(this.table.options.footerElement));
          break;
        default:
          this.element = this.table.options.footerElement;
          break;
      }
  }
  getElement() {
    return this.element;
  }
  append(e) {
    this.activate(), this.containerElement.appendChild(e), this.table.rowManager.adjustTableSize();
  }
  prepend(e) {
    this.activate(), this.element.insertBefore(e, this.element.firstChild), this.table.rowManager.adjustTableSize();
  }
  remove(e) {
    e.parentNode.removeChild(e), this.deactivate();
  }
  deactivate(e) {
    (!this.element.firstChild || e) && (this.external || this.element.parentNode.removeChild(this.element), this.active = !1);
  }
  activate() {
    this.active || (this.active = !0, this.external || (this.table.element.appendChild(this.getElement()), this.table.element.style.display = ""));
  }
  redraw() {
    this.dispatch("footer-redraw");
  }
}
class qr extends ie {
  constructor(e) {
    super(e), this.el = null, this.abortClasses = ["tabulator-headers", "tabulator-table"], this.previousTargets = {}, this.listeners = [
      "click",
      "dblclick",
      "contextmenu",
      "mouseenter",
      "mouseleave",
      "mouseover",
      "mouseout",
      "mousemove",
      "mouseup",
      "mousedown",
      "touchstart",
      "touchend"
    ], this.componentMap = {
      "tabulator-cell": "cell",
      "tabulator-row": "row",
      "tabulator-group": "group",
      "tabulator-col": "column"
    }, this.pseudoTrackers = {
      row: {
        subscriber: null,
        target: null
      },
      cell: {
        subscriber: null,
        target: null
      },
      group: {
        subscriber: null,
        target: null
      },
      column: {
        subscriber: null,
        target: null
      }
    }, this.pseudoTracking = !1;
  }
  initialize() {
    this.el = this.table.element, this.buildListenerMap(), this.bindSubscriptionWatchers();
  }
  buildListenerMap() {
    var e = {};
    this.listeners.forEach((t) => {
      e[t] = {
        handler: null,
        components: []
      };
    }), this.listeners = e;
  }
  bindPseudoEvents() {
    Object.keys(this.pseudoTrackers).forEach((e) => {
      this.pseudoTrackers[e].subscriber = this.pseudoMouseEnter.bind(this, e), this.subscribe(e + "-mouseover", this.pseudoTrackers[e].subscriber);
    }), this.pseudoTracking = !0;
  }
  pseudoMouseEnter(e, t, i) {
    this.pseudoTrackers[e].target !== i && (this.pseudoTrackers[e].target && this.dispatch(e + "-mouseleave", t, this.pseudoTrackers[e].target), this.pseudoMouseLeave(e, t), this.pseudoTrackers[e].target = i, this.dispatch(e + "-mouseenter", t, i));
  }
  pseudoMouseLeave(e, t) {
    var i = Object.keys(this.pseudoTrackers), s = {
      row: ["cell"],
      cell: ["row"]
    };
    i = i.filter((n) => {
      var r = s[e];
      return n !== e && (!r || r && !r.includes(n));
    }), i.forEach((n) => {
      var r = this.pseudoTrackers[n].target;
      this.pseudoTrackers[n].target && (this.dispatch(n + "-mouseleave", t, r), this.pseudoTrackers[n].target = null);
    });
  }
  bindSubscriptionWatchers() {
    var e = Object.keys(this.listeners), t = Object.values(this.componentMap);
    for (let i of t)
      for (let s of e) {
        let n = i + "-" + s;
        this.subscriptionChange(n, this.subscriptionChanged.bind(this, i, s));
      }
    this.subscribe("table-destroy", this.clearWatchers.bind(this));
  }
  subscriptionChanged(e, t, i) {
    var s = this.listeners[t].components, n = s.indexOf(e), r = !1;
    i ? n === -1 && (s.push(e), r = !0) : this.subscribed(e + "-" + t) || n > -1 && (s.splice(n, 1), r = !0), (t === "mouseenter" || t === "mouseleave") && !this.pseudoTracking && this.bindPseudoEvents(), r && this.updateEventListeners();
  }
  updateEventListeners() {
    for (let e in this.listeners) {
      let t = this.listeners[e];
      t.components.length ? t.handler || (t.handler = this.track.bind(this, e), this.el.addEventListener(e, t.handler)) : t.handler && (this.el.removeEventListener(e, t.handler), t.handler = null);
    }
  }
  track(e, t) {
    var i = t.composedPath && t.composedPath() || t.path, s = this.findTargets(i);
    s = this.bindComponents(e, s), this.triggerEvents(e, t, s), this.pseudoTracking && (e == "mouseover" || e == "mouseleave") && !Object.keys(s).length && this.pseudoMouseLeave("none", t);
  }
  findTargets(e) {
    var t = {};
    let i = Object.keys(this.componentMap);
    for (let s of e) {
      let n = s.classList ? [...s.classList] : [];
      if (n.filter((l) => this.abortClasses.includes(l)).length)
        break;
      let a = n.filter((l) => i.includes(l));
      for (let l of a)
        t[this.componentMap[l]] || (t[this.componentMap[l]] = s);
    }
    return t.group && t.group === t.row && delete t.row, t;
  }
  bindComponents(e, t) {
    var i = Object.keys(t).reverse(), s = this.listeners[e], n = {}, r = {}, a = {};
    for (let l of i) {
      let h, d = t[l], c = this.previousTargets[l];
      if (c && c.target === d)
        h = c.component;
      else
        switch (l) {
          case "row":
          case "group":
            (s.components.includes("row") || s.components.includes("cell") || s.components.includes("group")) && (h = this.table.rowManager.getVisibleRows(!0).find((f) => f.getElement() === d), t.row && t.row.parentNode && t.row.parentNode.closest(".tabulator-row") && (t[l] = !1));
            break;
          case "column":
            s.components.includes("column") && (h = this.table.columnManager.findColumn(d));
            break;
          case "cell":
            s.components.includes("cell") && (n.row instanceof te ? h = n.row.findCell(d) : t.row && console.warn("Event Target Lookup Error - The row this cell is attached to cannot be found, has the table been reinitialized without being destroyed first?"));
            break;
        }
      h && (n[l] = h, a[l] = {
        target: d,
        component: h
      });
    }
    return this.previousTargets = a, Object.keys(t).forEach((l) => {
      let h = n[l];
      r[l] = h;
    }), r;
  }
  triggerEvents(e, t, i) {
    var s = this.listeners[e];
    for (let n in i)
      i[n] && s.components.includes(n) && this.dispatch(n + "-" + e, t, i[n]);
  }
  clearWatchers() {
    for (let e in this.listeners) {
      let t = this.listeners[e];
      t.handler && (this.el.removeEventListener(e, t.handler), t.handler = null);
    }
  }
}
class Kr {
  constructor(e) {
    this.table = e, this.bindings = {};
  }
  bind(e, t, i) {
    this.bindings[e] || (this.bindings[e] = {}), this.bindings[e][t] ? console.warn("Unable to bind component handler, a matching function name is already bound", e, t, i) : this.bindings[e][t] = i;
  }
  handle(e, t, i) {
    if (this.bindings[e] && this.bindings[e][i] && typeof this.bindings[e][i].bind == "function")
      return this.bindings[e][i].bind(null, t);
    i !== "then" && typeof i == "string" && !i.startsWith("_") && this.table.options.debugInvalidComponentFuncs && console.error("The " + e + " component does not have a " + i + " function, have you checked that you have the correct Tabulator module installed?");
  }
}
class Jr extends ie {
  constructor(e) {
    super(e), this.requestOrder = 0, this.loading = !1;
  }
  initialize() {
  }
  load(e, t, i, s, n, r) {
    var a = ++this.requestOrder;
    if (this.table.destroyed)
      return Promise.resolve();
    if (this.dispatchExternal("dataLoading", e), e && (e.indexOf("{") == 0 || e.indexOf("[") == 0) && (e = JSON.parse(e)), this.confirm("data-loading", [e, t, i, n])) {
      this.loading = !0, n || this.alertLoader(), t = this.chain("data-params", [e, i, n], t || {}, t || {}), t = this.mapParams(t, this.table.options.dataSendParams);
      var l = this.chain("data-load", [e, t, i, n], !1, Promise.resolve([]));
      return l.then((h) => {
        if (this.table.destroyed)
          console.warn("Data Load Response Blocked - Table has been destroyed");
        else {
          !Array.isArray(h) && typeof h == "object" && (h = this.mapParams(h, this.objectInvert(this.table.options.dataReceiveParams)));
          var d = this.chain("data-loaded", [h], null, h);
          a == this.requestOrder ? (this.clearAlert(), d !== !1 && (this.dispatchExternal("dataLoaded", d), this.table.rowManager.setData(d, s, typeof r > "u" ? !s : r))) : console.warn("Data Load Response Blocked - An active data load request was blocked by an attempt to change table data while the request was being made");
        }
      }).catch((h) => {
        console.error("Data Load Error: ", h), this.dispatchExternal("dataLoadError", h), n || this.alertError(), setTimeout(() => {
          this.clearAlert();
        }, this.table.options.dataLoaderErrorTimeout);
      }).finally(() => {
        this.loading = !1;
      });
    } else
      return this.dispatchExternal("dataLoaded", e), e || (e = []), this.table.rowManager.setData(e, s, typeof r > "u" ? !s : r), Promise.resolve();
  }
  mapParams(e, t) {
    var i = {};
    for (let s in e)
      i[t.hasOwnProperty(s) ? t[s] : s] = e[s];
    return i;
  }
  objectInvert(e) {
    var t = {};
    for (let i in e)
      t[e[i]] = i;
    return t;
  }
  blockActiveLoad() {
    this.requestOrder++;
  }
  alertLoader() {
    var e = typeof this.table.options.dataLoader == "function" ? this.table.options.dataLoader() : this.table.options.dataLoader;
    e && this.table.alertManager.alert(this.table.options.dataLoaderLoading || this.langText("data|loading"));
  }
  alertError() {
    this.table.alertManager.alert(this.table.options.dataLoaderError || this.langText("data|error"), "error");
  }
  clearAlert() {
    this.table.alertManager.clear();
  }
}
class Xr {
  constructor(e, t, i) {
    this.table = e, this.events = {}, this.optionsList = t || {}, this.subscriptionNotifiers = {}, this.dispatch = i ? this._debugDispatch.bind(this) : this._dispatch.bind(this), this.debug = i;
  }
  subscriptionChange(e, t) {
    this.subscriptionNotifiers[e] || (this.subscriptionNotifiers[e] = []), this.subscriptionNotifiers[e].push(t), this.subscribed(e) && this._notifySubscriptionChange(e, !0);
  }
  subscribe(e, t) {
    this.events[e] || (this.events[e] = []), this.events[e].push(t), this._notifySubscriptionChange(e, !0);
  }
  unsubscribe(e, t) {
    var i;
    if (this.events[e])
      if (t)
        if (i = this.events[e].findIndex((s) => s === t), i > -1)
          this.events[e].splice(i, 1);
        else {
          console.warn("Cannot remove event, no matching event found:", e, t);
          return;
        }
      else
        delete this.events[e];
    else {
      console.warn("Cannot remove event, no events set on:", e);
      return;
    }
    this._notifySubscriptionChange(e, !1);
  }
  subscribed(e) {
    return this.events[e] && this.events[e].length;
  }
  _notifySubscriptionChange(e, t) {
    var i = this.subscriptionNotifiers[e];
    i && i.forEach((s) => {
      s(t);
    });
  }
  _dispatch(e, ...t) {
    const i = this.events[e], s = i == null ? void 0 : i.length;
    if (s) {
      const n = i[0].apply(this.table, t);
      for (let r = 1; r < s; r++)
        i[r].apply(this.table, t);
      return n;
    }
  }
  _debugDispatch(e, ...t) {
    if (this.debug === !0 || this.debug.includes(e)) {
      const i = ["ExternalEvent:" + e, ...t];
      console.log(...i);
    }
    return this._dispatch(e, ...t);
  }
}
class Yr {
  constructor(e) {
    this.events = {}, this.subscriptionNotifiers = {}, this.dispatch = e ? this._debugDispatch.bind(this) : this._dispatch.bind(this), this.chain = e ? this._debugChain.bind(this) : this._chain.bind(this), this.confirm = e ? this._debugConfirm.bind(this) : this._confirm.bind(this), this.debug = e;
  }
  subscriptionChange(e, t) {
    this.subscriptionNotifiers[e] || (this.subscriptionNotifiers[e] = []), this.subscriptionNotifiers[e].push(t), this.subscribed(e) && this._notifySubscriptionChange(e, !0);
  }
  subscribe(e, t, i = 1e4) {
    this.events[e] || (this.events[e] = []), this.events[e].push({ callback: t, priority: i }), this.events[e].sort((s, n) => s.priority - n.priority), this._notifySubscriptionChange(e, !0);
  }
  unsubscribe(e, t) {
    var i;
    if (this.events[e]) {
      if (t)
        if (i = this.events[e].findIndex((s) => s.callback === t), i > -1)
          this.events[e].splice(i, 1);
        else {
          console.warn("Cannot remove event, no matching event found:", e, t);
          return;
        }
    } else {
      console.warn("Cannot remove event, no events set on:", e);
      return;
    }
    this._notifySubscriptionChange(e, !1);
  }
  subscribed(e) {
    return this.events[e] && this.events[e].length;
  }
  _chain(e, t, i, s) {
    const n = this.events[e];
    if (n && n.length) {
      Array.isArray(t) || (t = [t]);
      const r = t.slice(), a = r.length;
      let l = i;
      for (let h = 0; h < n.length; h++)
        r[a] = l, l = n[h].callback.apply(this, r);
      return l;
    }
    return typeof s == "function" ? s() : s;
  }
  _confirm(e, t) {
    var i = !1;
    return Array.isArray(t) || (t = [t]), this.subscribed(e) && this.events[e].forEach((s, n) => {
      s.callback.apply(this, t) && (i = !0);
    }), i;
  }
  _notifySubscriptionChange(e, t) {
    var i = this.subscriptionNotifiers[e];
    i && i.forEach((s) => {
      s(t);
    });
  }
  _dispatch(e, ...t) {
    const i = this.events[e];
    if (i)
      for (const s of i)
        s.callback.apply(this, t);
  }
  _debugDispatch(e, ...t) {
    if (this.debug === !0 || this.debug.includes(e)) {
      const i = ["InternalEvent:" + e, ...t];
      console.log(...i);
    }
    return this._dispatch(e, ...t);
  }
  _debugChain(e, t, i, s) {
    if (this.debug === !0 || this.debug.includes(e)) {
      const n = ["InternalEvent:" + e, t, i, s];
      console.log(...n);
    }
    return this._chain(e, t, i, s);
  }
  _debugConfirm(e, t) {
    if (this.debug === !0 || this.debug.includes(e)) {
      const i = ["InternalEvent:" + e, t];
      console.log(...i);
    }
    return this._confirm(e, t);
  }
}
class Zr extends ie {
  constructor(e) {
    super(e);
  }
  _warnUser() {
    this.options("debugDeprecation") && console.warn(...arguments);
  }
  check(e, t, i) {
    var s = "";
    return typeof this.options(e) < "u" ? (s = "Deprecated Setup Option - Use of the %c" + e + "%c option is now deprecated", t ? (s = s + ", Please use the %c" + t + "%c option instead", this._warnUser(s, "font-weight: bold;", "font-weight: normal;", "font-weight: bold;", "font-weight: normal;"), i && (this.table.options[t] = this.table.options[e])) : this._warnUser(s, "font-weight: bold;", "font-weight: normal;"), !1) : !0;
  }
  checkMsg(e, t) {
    return typeof this.options(e) < "u" ? (this._warnUser("%cDeprecated Setup Option - Use of the %c" + e + " %c option is now deprecated, " + t, "font-weight: normal;", "font-weight: bold;", "font-weight: normal;"), !1) : !0;
  }
  msg(e) {
    this._warnUser(e);
  }
}
class Qr extends ie {
  constructor(e) {
    super(e), this.deps = {}, this.props = {};
  }
  initialize() {
    this.deps = Object.assign({}, this.options("dependencies"));
  }
  lookup(e, t, i) {
    if (Array.isArray(e)) {
      for (const n of e) {
        var s = this.lookup(n, t, !0);
        if (s)
          break;
      }
      if (s)
        return s;
      this.error(e);
    } else
      return t ? this.lookupProp(e, t, i) : this.lookupKey(e, i);
  }
  lookupProp(e, t, i) {
    var s;
    if (this.props[e] && this.props[e][t])
      return this.props[e][t];
    if (s = this.lookupKey(e, i), s)
      return this.props[e] || (this.props[e] = {}), this.props[e][t] = s[t] || s, this.props[e][t];
  }
  lookupKey(e, t) {
    var i;
    return this.deps[e] ? i = this.deps[e] : window[e] ? (this.deps[e] = window[e], i = this.deps[e]) : t || this.error(e), i;
  }
  error(e) {
    console.error("Unable to find dependency", e, "Please check documentation and ensure you have imported the required library into your project");
  }
}
function eo(o, e) {
  e && this.table.columnManager.renderer.reinitializeColumnWidths(o), this.table.options.responsiveLayout && this.table.modExists("responsiveLayout", !0) && this.table.modules.responsiveLayout.update();
}
function _i(o, e) {
  o.forEach(function(t) {
    t.reinitializeWidth();
  }), this.table.options.responsiveLayout && this.table.modExists("responsiveLayout", !0) && this.table.modules.responsiveLayout.update();
}
function to(o, e) {
  var t = 0, i = this.table.rowManager.element.clientWidth, s = 0, n = !1;
  o.forEach((r, a) => {
    r.widthFixed || r.reinitializeWidth(), (this.table.options.responsiveLayout ? r.modules.responsive.visible : r.visible) && (n = r), r.visible && (t += r.getWidth());
  }), n ? (s = i - t + n.getWidth(), this.table.options.responsiveLayout && this.table.modExists("responsiveLayout", !0) && (n.setWidth(0), this.table.modules.responsiveLayout.update()), s > 0 ? n.setWidth(s) : n.reinitializeWidth()) : this.table.options.responsiveLayout && this.table.modExists("responsiveLayout", !0) && this.table.modules.responsiveLayout.update();
}
function io(o, e) {
  var t = this.table.rowManager.element.getBoundingClientRect().width, i = 0, s = 0, n = 0, r = 0, a = [], l = [], h = 0, d = 0, c = 0;
  function u(m) {
    var p;
    return typeof m == "string" ? m.indexOf("%") > -1 ? p = t / 100 * parseInt(m) : p = parseInt(m) : p = m, p;
  }
  function f(m, p, v, b) {
    var k = [], S = 0, F = 0, _ = 0, j = n, J = 0, U = 0, $ = [];
    function fe(T) {
      return v * (T.column.definition.widthGrow || 1);
    }
    function Y(T) {
      return u(T.width) - v * (T.column.definition.widthShrink || 0);
    }
    return m.forEach(function(T, I) {
      var Z = b ? Y(T) : fe(T);
      T.column.minWidth >= Z ? k.push(T) : T.column.maxWidth && T.column.maxWidth < Z ? (T.width = T.column.maxWidth, p -= T.column.maxWidth, j -= b ? T.column.definition.widthShrink || 1 : T.column.definition.widthGrow || 1, j && (v = Math.floor(p / j))) : ($.push(T), U += b ? T.column.definition.widthShrink || 1 : T.column.definition.widthGrow || 1);
    }), k.length ? (k.forEach(function(T) {
      S += b ? T.width - T.column.minWidth : T.column.minWidth, T.width = T.column.minWidth;
    }), F = p - S, _ = U ? Math.floor(F / U) : F, J = f($, F, _, b)) : (J = U ? p - Math.floor(p / U) * U : p, $.forEach(function(T) {
      T.width = b ? Y(T) : fe(T);
    })), J;
  }
  this.table.options.responsiveLayout && this.table.modExists("responsiveLayout", !0) && this.table.modules.responsiveLayout.update(), this.table.rowManager.element.scrollHeight > this.table.rowManager.element.clientHeight && (t -= this.table.rowManager.element.offsetWidth - this.table.rowManager.element.clientWidth), o.forEach(function(m) {
    var p, v, b;
    m.visible && (p = m.definition.width, v = parseInt(m.minWidth), p ? (b = u(p), i += b > v ? b : v, m.definition.widthShrink && (l.push({
      column: m,
      width: b > v ? b : v
    }), h += m.definition.widthShrink)) : (a.push({
      column: m,
      width: 0
    }), n += m.definition.widthGrow || 1));
  }), s = t - i, r = Math.floor(s / n), c = f(a, s, r, !1), a.length && c > 0 && (a[a.length - 1].width += c), a.forEach(function(m) {
    s -= m.width;
  }), d = Math.abs(c) + s, d > 0 && h && (c = f(l, d, Math.floor(d / h), !0)), c && l.length && (l[l.length - 1].width -= c), a.forEach(function(m) {
    m.column.setWidth(m.width);
  }), l.forEach(function(m) {
    m.column.setWidth(m.width);
  });
}
var so = {
  fitData: eo,
  fitDataFill: _i,
  fitDataTable: _i,
  fitDataStretch: to,
  fitColumns: io
};
const Qe = class Qe extends B {
  constructor(e) {
    super(e, "layout"), this.mode = null, this.registerTableOption("layout", "fitData"), this.registerTableOption("layoutColumnsOnNewData", !1), this.registerColumnOption("widthGrow"), this.registerColumnOption("widthShrink");
  }
  //initialize layout system
  initialize() {
    var e = this.table.options.layout;
    Qe.modes[e] ? this.mode = e : (console.warn("Layout Error - invalid mode set, defaulting to 'fitData' : " + e), this.mode = "fitData"), this.table.element.setAttribute("tabulator-layout", this.mode), this.subscribe("column-init", this.initializeColumn.bind(this));
  }
  initializeColumn(e) {
    e.definition.widthGrow && (e.definition.widthGrow = Number(e.definition.widthGrow)), e.definition.widthShrink && (e.definition.widthShrink = Number(e.definition.widthShrink));
  }
  getMode() {
    return this.mode;
  }
  //trigger table layout
  layout(e) {
    var t = this.table.columnManager.columnsByIndex.find((i) => i.definition.variableHeight || i.definition.formatter === "textarea");
    this.dispatch("layout-refreshing"), Qe.modes[this.mode].call(this, this.table.columnManager.columnsByIndex, e), t && this.table.rowManager.normalizeHeight(!0), this.dispatch("layout-refreshed");
  }
};
R(Qe, "moduleName", "layout"), //load defaults
R(Qe, "modes", so);
let fi = Qe;
var no = {
  default: {
    //hold default locale text
    groups: {
      item: "item",
      items: "items"
    },
    columns: {},
    data: {
      loading: "Loading",
      error: "Error"
    },
    pagination: {
      page_size: "Page Size",
      page_title: "Show Page",
      first: "First",
      first_title: "First Page",
      last: "Last",
      last_title: "Last Page",
      prev: "Prev",
      prev_title: "Prev Page",
      next: "Next",
      next_title: "Next Page",
      all: "All",
      counter: {
        showing: "Showing",
        of: "of",
        rows: "rows",
        pages: "pages"
      }
    },
    headerFilters: {
      default: "filter column...",
      columns: {}
    }
  }
};
const dt = class dt extends B {
  constructor(e) {
    super(e), this.locale = "default", this.lang = !1, this.bindings = {}, this.langList = {}, this.registerTableOption("locale", !1), this.registerTableOption("langs", {});
  }
  initialize() {
    this.langList = K.deepClone(dt.langs), this.table.options.columnDefaults.headerFilterPlaceholder !== !1 && this.setHeaderFilterPlaceholder(this.table.options.columnDefaults.headerFilterPlaceholder);
    for (let e in this.table.options.langs)
      this.installLang(e, this.table.options.langs[e]);
    this.setLocale(this.table.options.locale), this.registerTableFunction("setLocale", this.setLocale.bind(this)), this.registerTableFunction("getLocale", this.getLocale.bind(this)), this.registerTableFunction("getLang", this.getLang.bind(this));
  }
  //set header placeholder
  setHeaderFilterPlaceholder(e) {
    this.langList.default.headerFilters.default = e;
  }
  //setup a lang description object
  installLang(e, t) {
    this.langList[e] ? this._setLangProp(this.langList[e], t) : this.langList[e] = t;
  }
  _setLangProp(e, t) {
    for (let i in t)
      e[i] && typeof e[i] == "object" ? this._setLangProp(e[i], t[i]) : e[i] = t[i];
  }
  //set current locale
  setLocale(e) {
    e = e || "default";
    function t(i, s) {
      for (var n in i)
        typeof i[n] == "object" ? (s[n] || (s[n] = {}), t(i[n], s[n])) : s[n] = i[n];
    }
    if (e === !0 && navigator.language && (e = navigator.language.toLowerCase()), e && !this.langList[e]) {
      let i = e.split("-")[0];
      this.langList[i] ? (console.warn("Localization Error - Exact matching locale not found, using closest match: ", e, i), e = i) : (console.warn("Localization Error - Matching locale not found, using default: ", e), e = "default");
    }
    this.locale = e, this.lang = K.deepClone(this.langList.default || {}), e != "default" && t(this.langList[e], this.lang), this.dispatchExternal("localized", this.locale, this.lang), this._executeBindings();
  }
  //get current locale
  getLocale(e) {
    return this.locale;
  }
  //get lang object for given local or current if none provided
  getLang(e) {
    return e ? this.langList[e] : this.lang;
  }
  //get text for current locale
  getText(e, t) {
    var i = t ? e + "|" + t : e, s = i.split("|"), n = this._getLangElement(s, this.locale);
    return n || "";
  }
  //traverse langs object and find localized copy
  _getLangElement(e, t) {
    var i = this.lang;
    return e.forEach(function(s) {
      var n;
      i && (n = i[s], typeof n < "u" ? i = n : i = !1);
    }), i;
  }
  //set update binding
  bind(e, t) {
    this.bindings[e] || (this.bindings[e] = []), this.bindings[e].push(t), t(this.getText(e), this.lang);
  }
  //iterate through bindings and trigger updates
  _executeBindings() {
    for (let e in this.bindings)
      this.bindings[e].forEach((t) => {
        t(this.getText(e), this.lang);
      });
  }
};
R(dt, "moduleName", "localize"), //load defaults
R(dt, "langs", no);
let pi = dt;
class ps extends B {
  constructor(e) {
    super(e);
  }
  initialize() {
    this.registerTableFunction("tableComms", this.receive.bind(this));
  }
  getConnections(e) {
    var t = [], i;
    return i = this.table.constructor.registry.lookupTable(e), i.forEach((s) => {
      this.table !== s && t.push(s);
    }), t;
  }
  send(e, t, i, s) {
    var n = this.getConnections(e);
    n.forEach((r) => {
      r.tableComms(this.table.element, t, i, s);
    }), !n.length && e && console.warn("Table Connection Error - No tables matching selector found", e);
  }
  receive(e, t, i, s) {
    if (this.table.modExists(t))
      return this.table.modules[t].commsReceived(e, i, s);
    console.warn("Inter-table Comms Error - no such module:", t);
  }
}
R(ps, "moduleName", "comms");
var ro = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  CommsModule: ps,
  LayoutModule: fi,
  LocalizeModule: pi
});
const ce = class ce {
  static findTable(e) {
    var t = ce.registry.lookupTable(e, !0);
    return Array.isArray(t) && !t.length ? !1 : t;
  }
};
R(ce, "registry", {
  tables: [],
  register(e) {
    ce.registry.tables.push(e);
  },
  deregister(e) {
    var t = ce.registry.tables.indexOf(e);
    t > -1 && ce.registry.tables.splice(t, 1);
  },
  lookupTable(e, t) {
    var i = [], s, n;
    if (typeof e == "string") {
      if (s = document.querySelectorAll(e), s.length)
        for (var r = 0; r < s.length; r++)
          n = ce.registry.matchElement(s[r]), n && i.push(n);
    } else typeof HTMLElement < "u" && e instanceof HTMLElement || e instanceof ce ? (n = ce.registry.matchElement(e), n && i.push(n)) : Array.isArray(e) ? e.forEach(function(a) {
      i = i.concat(ce.registry.lookupTable(a));
    }) : t || console.warn("Table Connection Error - Invalid Selector", e);
    return i;
  },
  matchElement(e) {
    return ce.registry.tables.find(function(t) {
      return e instanceof ce ? t === e : t.element === e;
    });
  }
});
let mi = ce;
const G = class G extends mi {
  constructor() {
    super();
  }
  static initializeModuleBinder(e) {
    G.modulesRegistered || (G.modulesRegistered = !0, G._registerModules(ro, !0), e && G._registerModules(e));
  }
  static _extendModule(e, t, i) {
    if (G.moduleBindings[e]) {
      var s = G.moduleBindings[e][t];
      if (s)
        if (typeof i == "object")
          for (let n in i)
            s[n] = i[n];
        else
          console.warn("Module Error - Invalid value type, it must be an object");
      else
        console.warn("Module Error - property does not exist:", t);
    } else
      console.warn("Module Error - module does not exist:", e);
  }
  static _registerModules(e, t) {
    var i = Object.values(e);
    t && i.forEach((s) => {
      s.prototype.moduleCore = !0;
    }), G._registerModule(i);
  }
  static _registerModule(e) {
    Array.isArray(e) || (e = [e]), e.forEach((t) => {
      G._registerModuleBinding(t), G._registerModuleExtensions(t);
    });
  }
  static _registerModuleBinding(e) {
    e.moduleName ? G.moduleBindings[e.moduleName] = e : console.error("Unable to bind module, no moduleName defined", e.moduleName);
  }
  static _registerModuleExtensions(e) {
    var t = e.moduleExtensions;
    if (e.moduleExtensions)
      for (let i in t) {
        let s = t[i];
        if (G.moduleBindings[i])
          for (let n in s)
            G._extendModule(i, n, s[n]);
        else {
          G.moduleExtensions[i] || (G.moduleExtensions[i] = {});
          for (let n in s)
            G.moduleExtensions[i][n] || (G.moduleExtensions[i][n] = {}), Object.assign(G.moduleExtensions[i][n], s[n]);
        }
      }
    G._extendModuleFromQueue(e);
  }
  static _extendModuleFromQueue(e) {
    var t = G.moduleExtensions[e.moduleName];
    if (t)
      for (let i in t)
        G._extendModule(e.moduleName, i, t[i]);
  }
  //ensure that module are bound to instantiated function
  _bindModules() {
    var e = [], t = [], i = [];
    this.modules = {};
    for (var s in G.moduleBindings) {
      let n = G.moduleBindings[s], r = new n(this);
      this.modules[s] = r, n.prototype.moduleCore ? this.modulesCore.push(r) : n.moduleInitOrder ? n.moduleInitOrder < 0 ? e.push(r) : t.push(r) : i.push(r);
    }
    e.sort((n, r) => n.moduleInitOrder > r.moduleInitOrder ? 1 : -1), t.sort((n, r) => n.moduleInitOrder > r.moduleInitOrder ? 1 : -1), this.modulesRegular = e.concat(i.concat(t));
  }
};
R(G, "moduleBindings", {}), R(G, "moduleExtensions", {}), R(G, "modulesRegistered", !1), R(G, "defaultModules", !1);
let gi = G;
class oo extends ie {
  constructor(e) {
    super(e), this.element = this._createAlertElement(), this.msgElement = this._createMsgElement(), this.type = null, this.element.appendChild(this.msgElement);
  }
  _createAlertElement() {
    var e = document.createElement("div");
    return e.classList.add("tabulator-alert"), e;
  }
  _createMsgElement() {
    var e = document.createElement("div");
    return e.classList.add("tabulator-alert-msg"), e.setAttribute("role", "alert"), e;
  }
  _typeClass() {
    return "tabulator-alert-state-" + this.type;
  }
  alert(e, t = "msg") {
    if (e) {
      for (this.clear(), this.dispatch("alert-show", t), this.type = t; this.msgElement.firstChild; ) this.msgElement.removeChild(this.msgElement.firstChild);
      this.msgElement.classList.add(this._typeClass()), typeof e == "function" && (e = e()), e instanceof HTMLElement ? this.msgElement.appendChild(e) : this.msgElement.innerHTML = e, this.table.element.appendChild(this.element);
    }
  }
  clear() {
    this.dispatch("alert-hide", this.type), this.element.parentNode && this.element.parentNode.removeChild(this.element), this.msgElement.classList.remove(this._typeClass());
  }
}
const ke = class ke extends gi {
  static extendModule() {
    ke.initializeModuleBinder(), ke._extendModule(...arguments);
  }
  static registerModule() {
    ke.initializeModuleBinder(), ke._registerModule(...arguments);
  }
  constructor(e, t, i) {
    super(), ke.initializeModuleBinder(i), this.options = {}, this.columnManager = null, this.rowManager = null, this.footerManager = null, this.alertManager = null, this.vdomHoz = null, this.externalEvents = null, this.eventBus = null, this.interactionMonitor = !1, this.browser = "", this.browserSlow = !1, this.browserMobile = !1, this.rtl = !1, this.originalElement = null, this.componentFunctionBinder = new Kr(this), this.dataLoader = !1, this.modules = {}, this.modulesCore = [], this.modulesRegular = [], this.deprecationAdvisor = new Zr(this), this.optionsList = new fs(this, "table constructor"), this.dependencyRegistry = new Qr(this), this.initialized = !1, this.destroyed = !1, this.initializeElement(e) && (this.element.id ? this.instanceId = this.element.id : this.instanceId = Math.random().toString(36).slice(2, 7), this.initializeCoreSystems(t), setTimeout(() => {
      this._create();
    })), this.constructor.registry.register(this);
  }
  initializeElement(e) {
    return typeof HTMLElement < "u" && e instanceof HTMLElement ? (this.element = e, !0) : typeof e == "string" ? (this.element = document.querySelector(e), this.element ? !0 : (console.error("Tabulator Creation Error - no element found matching selector: ", e), !1)) : (console.error("Tabulator Creation Error - Invalid element provided:", e), !1);
  }
  initializeCoreSystems(e) {
    this.columnManager = new Wr(this), this.rowManager = new Ur(this), this.footerManager = new $r(this), this.dataLoader = new Jr(this), this.alertManager = new oo(this), this._bindModules(), this.options = this.optionsList.generate(ke.defaultOptions, e), this._clearObjectPointers(), this._mapDeprecatedFunctionality(), this.externalEvents = new Xr(this, this.options, this.options.debugEventsExternal), this.eventBus = new Yr(this.options.debugEventsInternal), this.interactionMonitor = new qr(this), this.dataLoader.initialize(), this.footerManager.initialize(), this.dependencyRegistry.initialize();
  }
  //convert deprecated functionality to new functions
  _mapDeprecatedFunctionality() {
  }
  _clearSelection() {
    this.element.classList.add("tabulator-block-select"), window.getSelection ? window.getSelection().empty ? window.getSelection().empty() : window.getSelection().removeAllRanges && window.getSelection().removeAllRanges() : document.selection && document.selection.empty(), this.element.classList.remove("tabulator-block-select");
  }
  //create table
  _create() {
    this.externalEvents.dispatch("tableBuilding"), this.eventBus.dispatch("table-building"), this._rtlCheck(), this._buildElement(), this._initializeTable(), this.initialized = !0, this._loadInitialData().finally(() => {
      this.eventBus.dispatch("table-initialized"), this.externalEvents.dispatch("tableBuilt");
    });
  }
  _rtlCheck() {
    var e = window.getComputedStyle(this.element);
    switch (this.options.textDirection) {
      case "auto":
        if (e.direction !== "rtl")
          break;
      case "rtl":
        this.element.classList.add("tabulator-rtl"), this.rtl = !0;
        break;
      case "ltr":
        this.element.classList.add("tabulator-ltr");
      default:
        this.rtl = !1;
    }
  }
  //clear pointers to objects in default config object
  _clearObjectPointers() {
    this.options.columns = this.options.columns.slice(0), Array.isArray(this.options.data) && !this.options.reactiveData && (this.options.data = this.options.data.slice(0));
  }
  //build tabulator element
  _buildElement() {
    var e = this.element, t = this.options, i;
    if (e.tagName === "TABLE") {
      this.originalElement = this.element, i = document.createElement("div");
      var s = e.attributes;
      for (var n in s)
        typeof s[n] == "object" && i.setAttribute(s[n].name, s[n].value);
      e.parentNode.replaceChild(i, e), this.element = e = i;
    }
    for (e.classList.add("tabulator"), e.setAttribute("role", "grid"), e.setAttribute("aria-owns", "tabulator-table-body-" + this.instanceId); e.firstChild; ) e.removeChild(e.firstChild);
    t.height && (t.height = isNaN(t.height) ? t.height : t.height + "px", e.style.height = t.height), t.minHeight !== !1 && (t.minHeight = isNaN(t.minHeight) ? t.minHeight : t.minHeight + "px", e.style.minHeight = t.minHeight), t.maxHeight !== !1 && (t.maxHeight = isNaN(t.maxHeight) ? t.maxHeight : t.maxHeight + "px", e.style.maxHeight = t.maxHeight);
  }
  //initialize core systems and modules
  _initializeTable() {
    var e = this.element, t = this.options;
    this.interactionMonitor.initialize(), this.columnManager.initialize(), this.rowManager.initialize(), this._detectBrowser(), this.modulesCore.forEach((i) => {
      i.initialize();
    }), e.appendChild(this.columnManager.getElement()), e.appendChild(this.rowManager.getElement()), t.footerElement && this.footerManager.activate(), t.autoColumns && t.data && this.columnManager.generateColumnsFromRowData(this.options.data), this.modulesRegular.forEach((i) => {
      i.initialize();
    }), this.columnManager.setColumns(t.columns), this.eventBus.dispatch("table-built");
  }
  _loadInitialData() {
    return this.dataLoader.load(this.options.data).finally(() => {
      this.columnManager.verticalAlignHeaders();
    });
  }
  //deconstructor
  destroy() {
    var e = this.element;
    for (this.destroyed = !0, this.constructor.registry.deregister(this), this.eventBus.dispatch("table-destroy"), this.rowManager.destroy(); e.firstChild; ) e.removeChild(e.firstChild);
    e.classList.remove("tabulator"), e.removeAttribute("tabulator-layout"), this.externalEvents.dispatch("tableDestroyed");
  }
  _detectBrowser() {
    var e = navigator.userAgent || navigator.vendor || window.opera;
    e.indexOf("Trident") > -1 ? (this.browser = "ie", this.browserSlow = !0) : e.indexOf("Edge") > -1 ? (this.browser = "edge", this.browserSlow = !0) : e.indexOf("Firefox") > -1 ? (this.browser = "firefox", this.browserSlow = !1) : e.indexOf("Mac OS") > -1 ? (this.browser = "safari", this.browserSlow = !1) : (this.browser = "other", this.browserSlow = !1), this.browserMobile = /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(e) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw-(n|u)|c55\/|capi|ccwa|cdm-|cell|chtm|cldc|cmd-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc-s|devi|dica|dmob|do(c|p)o|ds(12|-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(-|_)|g1 u|g560|gene|gf-5|g-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd-(m|p|t)|hei-|hi(pt|ta)|hp( i|ip)|hs-c|ht(c(-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i-(20|go|ma)|i230|iac( |-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|-[a-w])|libw|lynx|m1-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|-([1-8]|c))|phil|pire|pl(ay|uc)|pn-2|po(ck|rt|se)|prox|psio|pt-g|qa-a|qc(07|12|21|32|60|-[2-7]|i-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h-|oo|p-)|sdk\/|se(c(-|0|1)|47|mc|nd|ri)|sgh-|shar|sie(-|m)|sk-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h-|v-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl-|tdg-|tel(i|m)|tim-|t-mo|to(pl|sh)|ts(70|m-|m3|m5)|tx-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas-|your|zeto|zte-/i.test(e.slice(0, 4));
  }
  initGuard(e, t) {
    var i, s;
    return this.options.debugInitialization && !this.initialized && (e || (i = new Error().stack.split(`
`), s = i[0] == "Error" ? i[2] : i[1], s[0] == " " ? e = s.trim().split(" ")[1].split(".")[1] : e = s.trim().split("@")[0]), console.warn("Table Not Initialized - Calling the " + e + " function before the table is initialized may result in inconsistent behavior, Please wait for the `tableBuilt` event before calling this function." + (t ? " " + t : ""))), this.initialized;
  }
  ////////////////// Data Handling //////////////////
  //block table redrawing
  blockRedraw() {
    this.initGuard(), this.eventBus.dispatch("redraw-blocking"), this.rowManager.blockRedraw(), this.columnManager.blockRedraw(), this.eventBus.dispatch("redraw-blocked");
  }
  //restore table redrawing
  restoreRedraw() {
    this.initGuard(), this.eventBus.dispatch("redraw-restoring"), this.rowManager.restoreRedraw(), this.columnManager.restoreRedraw(), this.eventBus.dispatch("redraw-restored");
  }
  //load data
  setData(e, t, i) {
    return this.initGuard(!1, "To set initial data please use the 'data' property in the table constructor."), this.dataLoader.load(e, t, i, !1);
  }
  //clear data
  clearData() {
    this.initGuard(), this.dataLoader.blockActiveLoad(), this.rowManager.clearData();
  }
  //get table data array
  getData(e) {
    return this.rowManager.getData(e);
  }
  //get table data array count
  getDataCount(e) {
    return this.rowManager.getDataCount(e);
  }
  getRedrawBlock() {
    return this.rowManager.redrawBlock || this.columnManager.redrawBlock;
  }
  //replace data, keeping table in position with same sort
  replaceData(e, t, i) {
    return this.initGuard(), this.dataLoader.load(e, t, i, !0, !0);
  }
  //update table data
  updateData(e) {
    var t = 0;
    return this.initGuard(), new Promise((i, s) => {
      this.dataLoader.blockActiveLoad(), typeof e == "string" && (e = JSON.parse(e)), e && e.length > 0 ? e.forEach((n) => {
        var r = this.rowManager.findRow(n[this.options.index]);
        r ? (t++, r.updateData(n).then(() => {
          t--, t || i();
        }).catch((a) => {
          s("Update Error - Unable to update row", n, a);
        })) : s("Update Error - Unable to find row", n);
      }) : (console.warn("Update Error - No data provided"), s("Update Error - No data provided"));
    });
  }
  addData(e, t, i) {
    return this.initGuard(), new Promise((s, n) => {
      this.dataLoader.blockActiveLoad(), typeof e == "string" && (e = JSON.parse(e)), e ? this.rowManager.addRows(e, t, i).then((r) => {
        var a = [];
        r.forEach(function(l) {
          a.push(l.getComponent());
        }), s(a);
      }) : (console.warn("Update Error - No data provided"), n("Update Error - No data provided"));
    });
  }
  //update table data
  updateOrAddData(e) {
    var t = [], i = 0;
    return this.initGuard(), new Promise((s, n) => {
      this.dataLoader.blockActiveLoad(), typeof e == "string" && (e = JSON.parse(e)), e && e.length > 0 ? e.forEach((r) => {
        var a = this.rowManager.findRow(r[this.options.index]);
        i++, a ? a.updateData(r).then(() => {
          i--, t.push(a.getComponent()), i || s(t);
        }) : this.rowManager.addRows(r).then((l) => {
          i--, t.push(l[0].getComponent()), i || s(t);
        });
      }) : (console.warn("Update Error - No data provided"), n("Update Error - No data provided"));
    });
  }
  //get row object
  getRow(e) {
    var t = this.rowManager.findRow(e);
    return t ? t.getComponent() : (console.warn("Find Error - No matching row found:", e), !1);
  }
  //get row object
  getRowFromPosition(e) {
    var t = this.rowManager.getRowFromPosition(e);
    return t ? t.getComponent() : (console.warn("Find Error - No matching row found:", e), !1);
  }
  //delete row from table
  deleteRow(e) {
    var t = [];
    this.initGuard(), Array.isArray(e) || (e = [e]);
    for (let i of e) {
      let s = this.rowManager.findRow(i, !0);
      if (s)
        t.push(s);
      else
        return console.error("Delete Error - No matching row found:", i), Promise.reject("Delete Error - No matching row found");
    }
    return t.sort((i, s) => this.rowManager.rows.indexOf(i) > this.rowManager.rows.indexOf(s) ? 1 : -1), t.forEach((i) => {
      i.delete();
    }), this.rowManager.reRenderInPosition(), Promise.resolve();
  }
  //add row to table
  addRow(e, t, i) {
    return this.initGuard(), typeof e == "string" && (e = JSON.parse(e)), this.rowManager.addRows(e, t, i, !0).then((s) => s[0].getComponent());
  }
  //update a row if it exists otherwise create it
  updateOrAddRow(e, t) {
    var i = this.rowManager.findRow(e);
    return this.initGuard(), typeof t == "string" && (t = JSON.parse(t)), i ? i.updateData(t).then(() => i.getComponent()) : this.rowManager.addRows(t).then((s) => s[0].getComponent());
  }
  //update row data
  updateRow(e, t) {
    var i = this.rowManager.findRow(e);
    return this.initGuard(), typeof t == "string" && (t = JSON.parse(t)), i ? i.updateData(t).then(() => Promise.resolve(i.getComponent())) : (console.warn("Update Error - No matching row found:", e), Promise.reject("Update Error - No matching row found"));
  }
  //scroll to row in DOM
  scrollToRow(e, t, i) {
    var s = this.rowManager.findRow(e);
    return s ? this.rowManager.scrollToRow(s, t, i) : (console.warn("Scroll Error - No matching row found:", e), Promise.reject("Scroll Error - No matching row found"));
  }
  moveRow(e, t, i) {
    var s = this.rowManager.findRow(e);
    this.initGuard(), s ? s.moveToRow(t, i) : console.warn("Move Error - No matching row found:", e);
  }
  getRows(e) {
    return this.rowManager.getComponents(e);
  }
  //get position of row in table
  getRowPosition(e) {
    var t = this.rowManager.findRow(e);
    return t ? t.getPosition() : (console.warn("Position Error - No matching row found:", e), !1);
  }
  /////////////// Column Functions  ///////////////
  setColumns(e) {
    this.initGuard(!1, "To set initial columns please use the 'columns' property in the table constructor"), this.columnManager.setColumns(e);
  }
  getColumns(e) {
    return this.columnManager.getComponents(e);
  }
  getColumn(e) {
    var t = this.columnManager.findColumn(e);
    return t ? t.getComponent() : (console.warn("Find Error - No matching column found:", e), !1);
  }
  getColumnDefinitions() {
    return this.columnManager.getDefinitionTree();
  }
  showColumn(e) {
    var t = this.columnManager.findColumn(e);
    if (this.initGuard(), t)
      t.show();
    else
      return console.warn("Column Show Error - No matching column found:", e), !1;
  }
  hideColumn(e) {
    var t = this.columnManager.findColumn(e);
    if (this.initGuard(), t)
      t.hide();
    else
      return console.warn("Column Hide Error - No matching column found:", e), !1;
  }
  toggleColumn(e) {
    var t = this.columnManager.findColumn(e);
    if (this.initGuard(), t)
      t.visible ? t.hide() : t.show();
    else
      return console.warn("Column Visibility Toggle Error - No matching column found:", e), !1;
  }
  addColumn(e, t, i) {
    var s = this.columnManager.findColumn(i);
    return this.initGuard(), this.columnManager.addColumn(e, t, s).then((n) => n.getComponent());
  }
  deleteColumn(e) {
    var t = this.columnManager.findColumn(e);
    return this.initGuard(), t ? t.delete() : (console.warn("Column Delete Error - No matching column found:", e), Promise.reject());
  }
  updateColumnDefinition(e, t) {
    var i = this.columnManager.findColumn(e);
    return this.initGuard(), i ? i.updateDefinition(t) : (console.warn("Column Update Error - No matching column found:", e), Promise.reject());
  }
  moveColumn(e, t, i) {
    var s = this.columnManager.findColumn(e), n = this.columnManager.findColumn(t);
    this.initGuard(), s ? n ? this.columnManager.moveColumn(s, n, i) : console.warn("Move Error - No matching column found:", n) : console.warn("Move Error - No matching column found:", e);
  }
  //scroll to column in DOM
  scrollToColumn(e, t, i) {
    return new Promise((s, n) => {
      var r = this.columnManager.findColumn(e);
      return r ? this.columnManager.scrollToColumn(r, t, i) : (console.warn("Scroll Error - No matching column found:", e), Promise.reject("Scroll Error - No matching column found"));
    });
  }
  //////////// General Public Functions ////////////
  //redraw list without updating data
  redraw(e) {
    this.initGuard(), this.columnManager.redraw(e), this.rowManager.redraw(e);
  }
  setHeight(e) {
    this.options.height = isNaN(e) ? e : e + "px", this.element.style.height = this.options.height, this.rowManager.initializeRenderer(), this.rowManager.redraw(!0);
  }
  setMaxHeight(e) {
    this.options.maxHeight = isNaN(e) ? e : e + "px", this.element.style.maxHeight = this.options.maxHeight, this.rowManager.initializeRenderer(), this.rowManager.redraw(!0);
  }
  setMinHeight(e) {
    this.options.minHeight = isNaN(e) ? e : e + "px", this.element.style.minHeight = this.options.minHeight, this.rowManager.initializeRenderer(), this.rowManager.redraw(!0);
  }
  //////////////////// Event Bus ///////////////////
  on(e, t) {
    this.externalEvents.subscribe(e, t);
  }
  off(e, t) {
    this.externalEvents.unsubscribe(e, t);
  }
  dispatchEvent() {
    var e = Array.from(arguments);
    e.shift(), this.externalEvents.dispatch(...arguments);
  }
  //////////////////// Alerts ///////////////////
  alert(e, t) {
    this.initGuard(), this.alertManager.alert(e, t);
  }
  clearAlert() {
    this.initGuard(), this.alertManager.clear();
  }
  ////////////// Extension Management //////////////
  modExists(e, t) {
    return this.modules[e] ? !0 : (t && console.error("Tabulator Module Not Installed: " + e), !1);
  }
  module(e) {
    var t = this.modules[e];
    return t || console.error("Tabulator module not installed: " + e), t;
  }
};
//default setup options
R(ke, "defaultOptions", Br);
let Be = ke;
class ao extends Be {
  static extendModule() {
    Be.initializeModuleBinder(jt), Be._extendModule(...arguments);
  }
  static registerModule() {
    Be.initializeModuleBinder(jt), Be._registerModule(...arguments);
  }
  constructor(e, t, i) {
    super(e, t, jt);
  }
}
/*!
 *  decimal.js v10.6.0
 *  An arbitrary-precision Decimal type for JavaScript.
 *  https://github.com/MikeMcl/decimal.js
 *  Copyright (c) 2025 Michael Mclaughlin <M8ch88l@gmail.com>
 *  MIT Licence
 */
var Je = 9e15, _e = 1e9, bi = "0123456789abcdef", Rt = "2.3025850929940456840179914546843642076011014886287729760333279009675726096773524802359972050895982983419677840422862486334095254650828067566662873690987816894829072083255546808437998948262331985283935053089653777326288461633662222876982198867465436674744042432743651550489343149393914796194044002221051017141748003688084012647080685567743216228355220114804663715659121373450747856947683463616792101806445070648000277502684916746550586856935673420670581136429224554405758925724208241314695689016758940256776311356919292033376587141660230105703089634572075440370847469940168269282808481184289314848524948644871927809676271275775397027668605952496716674183485704422507197965004714951050492214776567636938662976979522110718264549734772662425709429322582798502585509785265383207606726317164309505995087807523710333101197857547331541421808427543863591778117054309827482385045648019095610299291824318237525357709750539565187697510374970888692180205189339507238539205144634197265287286965110862571492198849978748873771345686209167058", xt = "3.1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679821480865132823066470938446095505822317253594081284811174502841027019385211055596446229489549303819644288109756659334461284756482337867831652712019091456485669234603486104543266482133936072602491412737245870066063155881748815209209628292540917153643678925903600113305305488204665213841469519415116094330572703657595919530921861173819326117931051185480744623799627495673518857527248912279381830119491298336733624406566430860213949463952247371907021798609437027705392171762931767523846748184676694051320005681271452635608277857713427577896091736371787214684409012249534301465495853710507922796892589235420199561121290219608640344181598136297747713099605187072113499999983729780499510597317328160963185950244594553469083026425223082533446850352619311881710100031378387528865875332083814206171776691473035982534904287554687311595628638823537875937519577818577805321712268066130019278766111959092164201989380952572010654858632789", vi = {
  // These values must be integers within the stated ranges (inclusive).
  // Most of these values can be changed at run-time using the `Decimal.config` method.
  // The maximum number of significant digits of the result of a calculation or base conversion.
  // E.g. `Decimal.config({ precision: 20 });`
  precision: 20,
  // 1 to MAX_DIGITS
  // The rounding mode used when rounding to `precision`.
  //
  // ROUND_UP         0 Away from zero.
  // ROUND_DOWN       1 Towards zero.
  // ROUND_CEIL       2 Towards +Infinity.
  // ROUND_FLOOR      3 Towards -Infinity.
  // ROUND_HALF_UP    4 Towards nearest neighbour. If equidistant, up.
  // ROUND_HALF_DOWN  5 Towards nearest neighbour. If equidistant, down.
  // ROUND_HALF_EVEN  6 Towards nearest neighbour. If equidistant, towards even neighbour.
  // ROUND_HALF_CEIL  7 Towards nearest neighbour. If equidistant, towards +Infinity.
  // ROUND_HALF_FLOOR 8 Towards nearest neighbour. If equidistant, towards -Infinity.
  //
  // E.g.
  // `Decimal.rounding = 4;`
  // `Decimal.rounding = Decimal.ROUND_HALF_UP;`
  rounding: 4,
  // 0 to 8
  // The modulo mode used when calculating the modulus: a mod n.
  // The quotient (q = a / n) is calculated according to the corresponding rounding mode.
  // The remainder (r) is calculated as: r = a - n * q.
  //
  // UP         0 The remainder is positive if the dividend is negative, else is negative.
  // DOWN       1 The remainder has the same sign as the dividend (JavaScript %).
  // FLOOR      3 The remainder has the same sign as the divisor (Python %).
  // HALF_EVEN  6 The IEEE 754 remainder function.
  // EUCLID     9 Euclidian division. q = sign(n) * floor(a / abs(n)). Always positive.
  //
  // Truncated division (1), floored division (3), the IEEE 754 remainder (6), and Euclidian
  // division (9) are commonly used for the modulus operation. The other rounding modes can also
  // be used, but they may not give useful results.
  modulo: 1,
  // 0 to 9
  // The exponent value at and beneath which `toString` returns exponential notation.
  // JavaScript numbers: -7
  toExpNeg: -7,
  // 0 to -EXP_LIMIT
  // The exponent value at and above which `toString` returns exponential notation.
  // JavaScript numbers: 21
  toExpPos: 21,
  // 0 to EXP_LIMIT
  // The minimum exponent value, beneath which underflow to zero occurs.
  // JavaScript numbers: -324  (5e-324)
  minE: -Je,
  // -1 to -EXP_LIMIT
  // The maximum exponent value, above which overflow to Infinity occurs.
  // JavaScript numbers: 308  (1.7976931348623157e+308)
  maxE: Je,
  // 1 to EXP_LIMIT
  // Whether to use cryptographically-secure random number generation, if available.
  crypto: !1
  // true/false
}, ms, Te, P = !0, St = "[DecimalError] ", Pe = St + "Invalid argument: ", gs = St + "Precision limit exceeded", bs = St + "crypto unavailable", vs = "[object Decimal]", oe = Math.floor, Q = Math.pow, lo = /^0b([01]+(\.[01]*)?|\.[01]+)(p[+-]?\d+)?$/i, ho = /^0x([0-9a-f]+(\.[0-9a-f]*)?|\.[0-9a-f]+)(p[+-]?\d+)?$/i, uo = /^0o([0-7]+(\.[0-7]*)?|\.[0-7]+)(p[+-]?\d+)?$/i, ws = /^(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i, me = 1e7, O = 7, co = 9007199254740991, fo = Rt.length - 1, wi = xt.length - 1, y = { toStringTag: vs };
y.absoluteValue = y.abs = function() {
  var o = new this.constructor(this);
  return o.s < 0 && (o.s = 1), H(o);
};
y.ceil = function() {
  return H(new this.constructor(this), this.e + 1, 2);
};
y.clampedTo = y.clamp = function(o, e) {
  var t, i = this, s = i.constructor;
  if (o = new s(o), e = new s(e), !o.s || !e.s) return new s(NaN);
  if (o.gt(e)) throw Error(Pe + e);
  return t = i.cmp(o), t < 0 ? o : i.cmp(e) > 0 ? e : new s(i);
};
y.comparedTo = y.cmp = function(o) {
  var e, t, i, s, n = this, r = n.d, a = (o = new n.constructor(o)).d, l = n.s, h = o.s;
  if (!r || !a)
    return !l || !h ? NaN : l !== h ? l : r === a ? 0 : !r ^ l < 0 ? 1 : -1;
  if (!r[0] || !a[0]) return r[0] ? l : a[0] ? -h : 0;
  if (l !== h) return l;
  if (n.e !== o.e) return n.e > o.e ^ l < 0 ? 1 : -1;
  for (i = r.length, s = a.length, e = 0, t = i < s ? i : s; e < t; ++e)
    if (r[e] !== a[e]) return r[e] > a[e] ^ l < 0 ? 1 : -1;
  return i === s ? 0 : i > s ^ l < 0 ? 1 : -1;
};
y.cosine = y.cos = function() {
  var o, e, t = this, i = t.constructor;
  return t.d ? t.d[0] ? (o = i.precision, e = i.rounding, i.precision = o + Math.max(t.e, t.sd()) + O, i.rounding = 1, t = po(i, xs(i, t)), i.precision = o, i.rounding = e, H(Te == 2 || Te == 3 ? t.neg() : t, o, e, !0)) : new i(1) : new i(NaN);
};
y.cubeRoot = y.cbrt = function() {
  var o, e, t, i, s, n, r, a, l, h, d = this, c = d.constructor;
  if (!d.isFinite() || d.isZero()) return new c(d);
  for (P = !1, n = d.s * Q(d.s * d, 1 / 3), !n || Math.abs(n) == 1 / 0 ? (t = ne(d.d), o = d.e, (n = (o - t.length + 1) % 3) && (t += n == 1 || n == -2 ? "0" : "00"), n = Q(t, 1 / 3), o = oe((o + 1) / 3) - (o % 3 == (o < 0 ? -1 : 2)), n == 1 / 0 ? t = "5e" + o : (t = n.toExponential(), t = t.slice(0, t.indexOf("e") + 1) + o), i = new c(t), i.s = d.s) : i = new c(n.toString()), r = (o = c.precision) + 3; ; )
    if (a = i, l = a.times(a).times(a), h = l.plus(d), i = q(h.plus(d).times(a), h.plus(l), r + 2, 1), ne(a.d).slice(0, r) === (t = ne(i.d)).slice(0, r))
      if (t = t.slice(r - 3, r + 1), t == "9999" || !s && t == "4999") {
        if (!s && (H(a, o + 1, 0), a.times(a).times(a).eq(d))) {
          i = a;
          break;
        }
        r += 4, s = 1;
      } else {
        (!+t || !+t.slice(1) && t.charAt(0) == "5") && (H(i, o + 1, 1), e = !i.times(i).times(i).eq(d));
        break;
      }
  return P = !0, H(i, o, c.rounding, e);
};
y.decimalPlaces = y.dp = function() {
  var o, e = this.d, t = NaN;
  if (e) {
    if (o = e.length - 1, t = (o - oe(this.e / O)) * O, o = e[o], o) for (; o % 10 == 0; o /= 10) t--;
    t < 0 && (t = 0);
  }
  return t;
};
y.dividedBy = y.div = function(o) {
  return q(this, new this.constructor(o));
};
y.dividedToIntegerBy = y.divToInt = function(o) {
  var e = this, t = e.constructor;
  return H(q(e, new t(o), 0, 1, 1), t.precision, t.rounding);
};
y.equals = y.eq = function(o) {
  return this.cmp(o) === 0;
};
y.floor = function() {
  return H(new this.constructor(this), this.e + 1, 3);
};
y.greaterThan = y.gt = function(o) {
  return this.cmp(o) > 0;
};
y.greaterThanOrEqualTo = y.gte = function(o) {
  var e = this.cmp(o);
  return e == 1 || e === 0;
};
y.hyperbolicCosine = y.cosh = function() {
  var o, e, t, i, s, n = this, r = n.constructor, a = new r(1);
  if (!n.isFinite()) return new r(n.s ? 1 / 0 : NaN);
  if (n.isZero()) return a;
  t = r.precision, i = r.rounding, r.precision = t + Math.max(n.e, n.sd()) + 4, r.rounding = 1, s = n.d.length, s < 32 ? (o = Math.ceil(s / 3), e = (1 / zt(4, o)).toString()) : (o = 16, e = "2.3283064365386962890625e-10"), n = et(r, 1, n.times(e), new r(1), !0);
  for (var l, h = o, d = new r(8); h--; )
    l = n.times(n), n = a.minus(l.times(d.minus(l.times(d))));
  return H(n, r.precision = t, r.rounding = i, !0);
};
y.hyperbolicSine = y.sinh = function() {
  var o, e, t, i, s = this, n = s.constructor;
  if (!s.isFinite() || s.isZero()) return new n(s);
  if (e = n.precision, t = n.rounding, n.precision = e + Math.max(s.e, s.sd()) + 4, n.rounding = 1, i = s.d.length, i < 3)
    s = et(n, 2, s, s, !0);
  else {
    o = 1.4 * Math.sqrt(i), o = o > 16 ? 16 : o | 0, s = s.times(1 / zt(5, o)), s = et(n, 2, s, s, !0);
    for (var r, a = new n(5), l = new n(16), h = new n(20); o--; )
      r = s.times(s), s = s.times(a.plus(r.times(l.times(r).plus(h))));
  }
  return n.precision = e, n.rounding = t, H(s, e, t, !0);
};
y.hyperbolicTangent = y.tanh = function() {
  var o, e, t = this, i = t.constructor;
  return t.isFinite() ? t.isZero() ? new i(t) : (o = i.precision, e = i.rounding, i.precision = o + 7, i.rounding = 1, q(t.sinh(), t.cosh(), i.precision = o, i.rounding = e)) : new i(t.s);
};
y.inverseCosine = y.acos = function() {
  var o = this, e = o.constructor, t = o.abs().cmp(1), i = e.precision, s = e.rounding;
  return t !== -1 ? t === 0 ? o.isNeg() ? Ce(e, i, s) : new e(0) : new e(NaN) : o.isZero() ? Ce(e, i + 4, s).times(0.5) : (e.precision = i + 6, e.rounding = 1, o = new e(1).minus(o).div(o.plus(1)).sqrt().atan(), e.precision = i, e.rounding = s, o.times(2));
};
y.inverseHyperbolicCosine = y.acosh = function() {
  var o, e, t = this, i = t.constructor;
  return t.lte(1) ? new i(t.eq(1) ? 0 : NaN) : t.isFinite() ? (o = i.precision, e = i.rounding, i.precision = o + Math.max(Math.abs(t.e), t.sd()) + 4, i.rounding = 1, P = !1, t = t.times(t).minus(1).sqrt().plus(t), P = !0, i.precision = o, i.rounding = e, t.ln()) : new i(t);
};
y.inverseHyperbolicSine = y.asinh = function() {
  var o, e, t = this, i = t.constructor;
  return !t.isFinite() || t.isZero() ? new i(t) : (o = i.precision, e = i.rounding, i.precision = o + 2 * Math.max(Math.abs(t.e), t.sd()) + 6, i.rounding = 1, P = !1, t = t.times(t).plus(1).sqrt().plus(t), P = !0, i.precision = o, i.rounding = e, t.ln());
};
y.inverseHyperbolicTangent = y.atanh = function() {
  var o, e, t, i, s = this, n = s.constructor;
  return s.isFinite() ? s.e >= 0 ? new n(s.abs().eq(1) ? s.s / 0 : s.isZero() ? s : NaN) : (o = n.precision, e = n.rounding, i = s.sd(), Math.max(i, o) < 2 * -s.e - 1 ? H(new n(s), o, e, !0) : (n.precision = t = i - s.e, s = q(s.plus(1), new n(1).minus(s), t + o, 1), n.precision = o + 4, n.rounding = 1, s = s.ln(), n.precision = o, n.rounding = e, s.times(0.5))) : new n(NaN);
};
y.inverseSine = y.asin = function() {
  var o, e, t, i, s = this, n = s.constructor;
  return s.isZero() ? new n(s) : (e = s.abs().cmp(1), t = n.precision, i = n.rounding, e !== -1 ? e === 0 ? (o = Ce(n, t + 4, i).times(0.5), o.s = s.s, o) : new n(NaN) : (n.precision = t + 6, n.rounding = 1, s = s.div(new n(1).minus(s.times(s)).sqrt().plus(1)).atan(), n.precision = t, n.rounding = i, s.times(2)));
};
y.inverseTangent = y.atan = function() {
  var o, e, t, i, s, n, r, a, l, h = this, d = h.constructor, c = d.precision, u = d.rounding;
  if (h.isFinite()) {
    if (h.isZero())
      return new d(h);
    if (h.abs().eq(1) && c + 4 <= wi)
      return r = Ce(d, c + 4, u).times(0.25), r.s = h.s, r;
  } else {
    if (!h.s) return new d(NaN);
    if (c + 4 <= wi)
      return r = Ce(d, c + 4, u).times(0.5), r.s = h.s, r;
  }
  for (d.precision = a = c + 10, d.rounding = 1, t = Math.min(28, a / O + 2 | 0), o = t; o; --o) h = h.div(h.times(h).plus(1).sqrt().plus(1));
  for (P = !1, e = Math.ceil(a / O), i = 1, l = h.times(h), r = new d(h), s = h; o !== -1; )
    if (s = s.times(l), n = r.minus(s.div(i += 2)), s = s.times(l), r = n.plus(s.div(i += 2)), r.d[e] !== void 0) for (o = e; r.d[o] === n.d[o] && o--; ) ;
  return t && (r = r.times(2 << t - 1)), P = !0, H(r, d.precision = c, d.rounding = u, !0);
};
y.isFinite = function() {
  return !!this.d;
};
y.isInteger = y.isInt = function() {
  return !!this.d && oe(this.e / O) > this.d.length - 2;
};
y.isNaN = function() {
  return !this.s;
};
y.isNegative = y.isNeg = function() {
  return this.s < 0;
};
y.isPositive = y.isPos = function() {
  return this.s > 0;
};
y.isZero = function() {
  return !!this.d && this.d[0] === 0;
};
y.lessThan = y.lt = function(o) {
  return this.cmp(o) < 0;
};
y.lessThanOrEqualTo = y.lte = function(o) {
  return this.cmp(o) < 1;
};
y.logarithm = y.log = function(o) {
  var e, t, i, s, n, r, a, l, h = this, d = h.constructor, c = d.precision, u = d.rounding, f = 5;
  if (o == null)
    o = new d(10), e = !0;
  else {
    if (o = new d(o), t = o.d, o.s < 0 || !t || !t[0] || o.eq(1)) return new d(NaN);
    e = o.eq(10);
  }
  if (t = h.d, h.s < 0 || !t || !t[0] || h.eq(1))
    return new d(t && !t[0] ? -1 / 0 : h.s != 1 ? NaN : t ? 0 : 1 / 0);
  if (e)
    if (t.length > 1)
      n = !0;
    else {
      for (s = t[0]; s % 10 === 0; ) s /= 10;
      n = s !== 1;
    }
  if (P = !1, a = c + f, r = Oe(h, a), i = e ? kt(d, a + 10) : Oe(o, a), l = q(r, i, a, 1), ct(l.d, s = c, u))
    do
      if (a += 10, r = Oe(h, a), i = e ? kt(d, a + 10) : Oe(o, a), l = q(r, i, a, 1), !n) {
        +ne(l.d).slice(s + 1, s + 15) + 1 == 1e14 && (l = H(l, c + 1, 0));
        break;
      }
    while (ct(l.d, s += 10, u));
  return P = !0, H(l, c, u);
};
y.minus = y.sub = function(o) {
  var e, t, i, s, n, r, a, l, h, d, c, u, f = this, m = f.constructor;
  if (o = new m(o), !f.d || !o.d)
    return !f.s || !o.s ? o = new m(NaN) : f.d ? o.s = -o.s : o = new m(o.d || f.s !== o.s ? f : NaN), o;
  if (f.s != o.s)
    return o.s = -o.s, f.plus(o);
  if (h = f.d, u = o.d, a = m.precision, l = m.rounding, !h[0] || !u[0]) {
    if (u[0]) o.s = -o.s;
    else if (h[0]) o = new m(f);
    else return new m(l === 3 ? -0 : 0);
    return P ? H(o, a, l) : o;
  }
  if (t = oe(o.e / O), d = oe(f.e / O), h = h.slice(), n = d - t, n) {
    for (c = n < 0, c ? (e = h, n = -n, r = u.length) : (e = u, t = d, r = h.length), i = Math.max(Math.ceil(a / O), r) + 2, n > i && (n = i, e.length = 1), e.reverse(), i = n; i--; ) e.push(0);
    e.reverse();
  } else {
    for (i = h.length, r = u.length, c = i < r, c && (r = i), i = 0; i < r; i++)
      if (h[i] != u[i]) {
        c = h[i] < u[i];
        break;
      }
    n = 0;
  }
  for (c && (e = h, h = u, u = e, o.s = -o.s), r = h.length, i = u.length - r; i > 0; --i) h[r++] = 0;
  for (i = u.length; i > n; ) {
    if (h[--i] < u[i]) {
      for (s = i; s && h[--s] === 0; ) h[s] = me - 1;
      --h[s], h[i] += me;
    }
    h[i] -= u[i];
  }
  for (; h[--r] === 0; ) h.pop();
  for (; h[0] === 0; h.shift()) --t;
  return h[0] ? (o.d = h, o.e = Dt(h, t), P ? H(o, a, l) : o) : new m(l === 3 ? -0 : 0);
};
y.modulo = y.mod = function(o) {
  var e, t = this, i = t.constructor;
  return o = new i(o), !t.d || !o.s || o.d && !o.d[0] ? new i(NaN) : !o.d || t.d && !t.d[0] ? H(new i(t), i.precision, i.rounding) : (P = !1, i.modulo == 9 ? (e = q(t, o.abs(), 0, 3, 1), e.s *= o.s) : e = q(t, o, 0, i.modulo, 1), e = e.times(o), P = !0, t.minus(e));
};
y.naturalExponential = y.exp = function() {
  return Ci(this);
};
y.naturalLogarithm = y.ln = function() {
  return Oe(this);
};
y.negated = y.neg = function() {
  var o = new this.constructor(this);
  return o.s = -o.s, H(o);
};
y.plus = y.add = function(o) {
  var e, t, i, s, n, r, a, l, h, d, c = this, u = c.constructor;
  if (o = new u(o), !c.d || !o.d)
    return !c.s || !o.s ? o = new u(NaN) : c.d || (o = new u(o.d || c.s === o.s ? c : NaN)), o;
  if (c.s != o.s)
    return o.s = -o.s, c.minus(o);
  if (h = c.d, d = o.d, a = u.precision, l = u.rounding, !h[0] || !d[0])
    return d[0] || (o = new u(c)), P ? H(o, a, l) : o;
  if (n = oe(c.e / O), i = oe(o.e / O), h = h.slice(), s = n - i, s) {
    for (s < 0 ? (t = h, s = -s, r = d.length) : (t = d, i = n, r = h.length), n = Math.ceil(a / O), r = n > r ? n + 1 : r + 1, s > r && (s = r, t.length = 1), t.reverse(); s--; ) t.push(0);
    t.reverse();
  }
  for (r = h.length, s = d.length, r - s < 0 && (s = r, t = d, d = h, h = t), e = 0; s; )
    e = (h[--s] = h[s] + d[s] + e) / me | 0, h[s] %= me;
  for (e && (h.unshift(e), ++i), r = h.length; h[--r] == 0; ) h.pop();
  return o.d = h, o.e = Dt(h, i), P ? H(o, a, l) : o;
};
y.precision = y.sd = function(o) {
  var e, t = this;
  if (o !== void 0 && o !== !!o && o !== 1 && o !== 0) throw Error(Pe + o);
  return t.d ? (e = Cs(t.d), o && t.e + 1 > e && (e = t.e + 1)) : e = NaN, e;
};
y.round = function() {
  var o = this, e = o.constructor;
  return H(new e(o), o.e + 1, e.rounding);
};
y.sine = y.sin = function() {
  var o, e, t = this, i = t.constructor;
  return t.isFinite() ? t.isZero() ? new i(t) : (o = i.precision, e = i.rounding, i.precision = o + Math.max(t.e, t.sd()) + O, i.rounding = 1, t = go(i, xs(i, t)), i.precision = o, i.rounding = e, H(Te > 2 ? t.neg() : t, o, e, !0)) : new i(NaN);
};
y.squareRoot = y.sqrt = function() {
  var o, e, t, i, s, n, r = this, a = r.d, l = r.e, h = r.s, d = r.constructor;
  if (h !== 1 || !a || !a[0])
    return new d(!h || h < 0 && (!a || a[0]) ? NaN : a ? r : 1 / 0);
  for (P = !1, h = Math.sqrt(+r), h == 0 || h == 1 / 0 ? (e = ne(a), (e.length + l) % 2 == 0 && (e += "0"), h = Math.sqrt(e), l = oe((l + 1) / 2) - (l < 0 || l % 2), h == 1 / 0 ? e = "5e" + l : (e = h.toExponential(), e = e.slice(0, e.indexOf("e") + 1) + l), i = new d(e)) : i = new d(h.toString()), t = (l = d.precision) + 3; ; )
    if (n = i, i = n.plus(q(r, n, t + 2, 1)).times(0.5), ne(n.d).slice(0, t) === (e = ne(i.d)).slice(0, t))
      if (e = e.slice(t - 3, t + 1), e == "9999" || !s && e == "4999") {
        if (!s && (H(n, l + 1, 0), n.times(n).eq(r))) {
          i = n;
          break;
        }
        t += 4, s = 1;
      } else {
        (!+e || !+e.slice(1) && e.charAt(0) == "5") && (H(i, l + 1, 1), o = !i.times(i).eq(r));
        break;
      }
  return P = !0, H(i, l, d.rounding, o);
};
y.tangent = y.tan = function() {
  var o, e, t = this, i = t.constructor;
  return t.isFinite() ? t.isZero() ? new i(t) : (o = i.precision, e = i.rounding, i.precision = o + 10, i.rounding = 1, t = t.sin(), t.s = 1, t = q(t, new i(1).minus(t.times(t)).sqrt(), o + 10, 0), i.precision = o, i.rounding = e, H(Te == 2 || Te == 4 ? t.neg() : t, o, e, !0)) : new i(NaN);
};
y.times = y.mul = function(o) {
  var e, t, i, s, n, r, a, l, h, d = this, c = d.constructor, u = d.d, f = (o = new c(o)).d;
  if (o.s *= d.s, !u || !u[0] || !f || !f[0])
    return new c(!o.s || u && !u[0] && !f || f && !f[0] && !u ? NaN : !u || !f ? o.s / 0 : o.s * 0);
  for (t = oe(d.e / O) + oe(o.e / O), l = u.length, h = f.length, l < h && (n = u, u = f, f = n, r = l, l = h, h = r), n = [], r = l + h, i = r; i--; ) n.push(0);
  for (i = h; --i >= 0; ) {
    for (e = 0, s = l + i; s > i; )
      a = n[s] + f[i] * u[s - i - 1] + e, n[s--] = a % me | 0, e = a / me | 0;
    n[s] = (n[s] + e) % me | 0;
  }
  for (; !n[--r]; ) n.pop();
  return e ? ++t : n.shift(), o.d = n, o.e = Dt(n, t), P ? H(o, c.precision, c.rounding) : o;
};
y.toBinary = function(o, e) {
  return xi(this, 2, o, e);
};
y.toDecimalPlaces = y.toDP = function(o, e) {
  var t = this, i = t.constructor;
  return t = new i(t), o === void 0 ? t : (he(o, 0, _e), e === void 0 ? e = i.rounding : he(e, 0, 8), H(t, o + t.e + 1, e));
};
y.toExponential = function(o, e) {
  var t, i = this, s = i.constructor;
  return o === void 0 ? t = Ee(i, !0) : (he(o, 0, _e), e === void 0 ? e = s.rounding : he(e, 0, 8), i = H(new s(i), o + 1, e), t = Ee(i, !0, o + 1)), i.isNeg() && !i.isZero() ? "-" + t : t;
};
y.toFixed = function(o, e) {
  var t, i, s = this, n = s.constructor;
  return o === void 0 ? t = Ee(s) : (he(o, 0, _e), e === void 0 ? e = n.rounding : he(e, 0, 8), i = H(new n(s), o + s.e + 1, e), t = Ee(i, !1, o + i.e + 1)), s.isNeg() && !s.isZero() ? "-" + t : t;
};
y.toFraction = function(o) {
  var e, t, i, s, n, r, a, l, h, d, c, u, f = this, m = f.d, p = f.constructor;
  if (!m) return new p(f);
  if (h = t = new p(1), i = l = new p(0), e = new p(i), n = e.e = Cs(m) - f.e - 1, r = n % O, e.d[0] = Q(10, r < 0 ? O + r : r), o == null)
    o = n > 0 ? e : h;
  else {
    if (a = new p(o), !a.isInt() || a.lt(h)) throw Error(Pe + a);
    o = a.gt(e) ? n > 0 ? e : h : a;
  }
  for (P = !1, a = new p(ne(m)), d = p.precision, p.precision = n = m.length * O * 2; c = q(a, e, 0, 1, 1), s = t.plus(c.times(i)), s.cmp(o) != 1; )
    t = i, i = s, s = h, h = l.plus(c.times(s)), l = s, s = e, e = a.minus(c.times(s)), a = s;
  return s = q(o.minus(t), i, 0, 1, 1), l = l.plus(s.times(h)), t = t.plus(s.times(i)), l.s = h.s = f.s, u = q(h, i, n, 1).minus(f).abs().cmp(q(l, t, n, 1).minus(f).abs()) < 1 ? [h, i] : [l, t], p.precision = d, P = !0, u;
};
y.toHexadecimal = y.toHex = function(o, e) {
  return xi(this, 16, o, e);
};
y.toNearest = function(o, e) {
  var t = this, i = t.constructor;
  if (t = new i(t), o == null) {
    if (!t.d) return t;
    o = new i(1), e = i.rounding;
  } else {
    if (o = new i(o), e === void 0 ? e = i.rounding : he(e, 0, 8), !t.d) return o.s ? t : o;
    if (!o.d)
      return o.s && (o.s = t.s), o;
  }
  return o.d[0] ? (P = !1, t = q(t, o, 0, e, 1).times(o), P = !0, H(t)) : (o.s = t.s, t = o), t;
};
y.toNumber = function() {
  return +this;
};
y.toOctal = function(o, e) {
  return xi(this, 8, o, e);
};
y.toPower = y.pow = function(o) {
  var e, t, i, s, n, r, a = this, l = a.constructor, h = +(o = new l(o));
  if (!a.d || !o.d || !a.d[0] || !o.d[0]) return new l(Q(+a, h));
  if (a = new l(a), a.eq(1)) return a;
  if (i = l.precision, n = l.rounding, o.eq(1)) return H(a, i, n);
  if (e = oe(o.e / O), e >= o.d.length - 1 && (t = h < 0 ? -h : h) <= co)
    return s = Es(l, a, t, i), o.s < 0 ? new l(1).div(s) : H(s, i, n);
  if (r = a.s, r < 0) {
    if (e < o.d.length - 1) return new l(NaN);
    if ((o.d[e] & 1) == 0 && (r = 1), a.e == 0 && a.d[0] == 1 && a.d.length == 1)
      return a.s = r, a;
  }
  return t = Q(+a, h), e = t == 0 || !isFinite(t) ? oe(h * (Math.log("0." + ne(a.d)) / Math.LN10 + a.e + 1)) : new l(t + "").e, e > l.maxE + 1 || e < l.minE - 1 ? new l(e > 0 ? r / 0 : 0) : (P = !1, l.rounding = a.s = 1, t = Math.min(12, (e + "").length), s = Ci(o.times(Oe(a, i + t)), i), s.d && (s = H(s, i + 5, 1), ct(s.d, i, n) && (e = i + 10, s = H(Ci(o.times(Oe(a, e + t)), e), e + 5, 1), +ne(s.d).slice(i + 1, i + 15) + 1 == 1e14 && (s = H(s, i + 1, 0)))), s.s = r, P = !0, l.rounding = n, H(s, i, n));
};
y.toPrecision = function(o, e) {
  var t, i = this, s = i.constructor;
  return o === void 0 ? t = Ee(i, i.e <= s.toExpNeg || i.e >= s.toExpPos) : (he(o, 1, _e), e === void 0 ? e = s.rounding : he(e, 0, 8), i = H(new s(i), o, e), t = Ee(i, o <= i.e || i.e <= s.toExpNeg, o)), i.isNeg() && !i.isZero() ? "-" + t : t;
};
y.toSignificantDigits = y.toSD = function(o, e) {
  var t = this, i = t.constructor;
  return o === void 0 ? (o = i.precision, e = i.rounding) : (he(o, 1, _e), e === void 0 ? e = i.rounding : he(e, 0, 8)), H(new i(t), o, e);
};
y.toString = function() {
  var o = this, e = o.constructor, t = Ee(o, o.e <= e.toExpNeg || o.e >= e.toExpPos);
  return o.isNeg() && !o.isZero() ? "-" + t : t;
};
y.truncated = y.trunc = function() {
  return H(new this.constructor(this), this.e + 1, 1);
};
y.valueOf = y.toJSON = function() {
  var o = this, e = o.constructor, t = Ee(o, o.e <= e.toExpNeg || o.e >= e.toExpPos);
  return o.isNeg() ? "-" + t : t;
};
function ne(o) {
  var e, t, i, s = o.length - 1, n = "", r = o[0];
  if (s > 0) {
    for (n += r, e = 1; e < s; e++)
      i = o[e] + "", t = O - i.length, t && (n += Le(t)), n += i;
    r = o[e], i = r + "", t = O - i.length, t && (n += Le(t));
  } else if (r === 0)
    return "0";
  for (; r % 10 === 0; ) r /= 10;
  return n + r;
}
function he(o, e, t) {
  if (o !== ~~o || o < e || o > t)
    throw Error(Pe + o);
}
function ct(o, e, t, i) {
  var s, n, r, a;
  for (n = o[0]; n >= 10; n /= 10) --e;
  return --e < 0 ? (e += O, s = 0) : (s = Math.ceil((e + 1) / O), e %= O), n = Q(10, O - e), a = o[s] % n | 0, i == null ? e < 3 ? (e == 0 ? a = a / 100 | 0 : e == 1 && (a = a / 10 | 0), r = t < 4 && a == 99999 || t > 3 && a == 49999 || a == 5e4 || a == 0) : r = (t < 4 && a + 1 == n || t > 3 && a + 1 == n / 2) && (o[s + 1] / n / 100 | 0) == Q(10, e - 2) - 1 || (a == n / 2 || a == 0) && (o[s + 1] / n / 100 | 0) == 0 : e < 4 ? (e == 0 ? a = a / 1e3 | 0 : e == 1 ? a = a / 100 | 0 : e == 2 && (a = a / 10 | 0), r = (i || t < 4) && a == 9999 || !i && t > 3 && a == 4999) : r = ((i || t < 4) && a + 1 == n || !i && t > 3 && a + 1 == n / 2) && (o[s + 1] / n / 1e3 | 0) == Q(10, e - 3) - 1, r;
}
function Ct(o, e, t) {
  for (var i, s = [0], n, r = 0, a = o.length; r < a; ) {
    for (n = s.length; n--; ) s[n] *= e;
    for (s[0] += bi.indexOf(o.charAt(r++)), i = 0; i < s.length; i++)
      s[i] > t - 1 && (s[i + 1] === void 0 && (s[i + 1] = 0), s[i + 1] += s[i] / t | 0, s[i] %= t);
  }
  return s.reverse();
}
function po(o, e) {
  var t, i, s;
  if (e.isZero()) return e;
  i = e.d.length, i < 32 ? (t = Math.ceil(i / 3), s = (1 / zt(4, t)).toString()) : (t = 16, s = "2.3283064365386962890625e-10"), o.precision += t, e = et(o, 1, e.times(s), new o(1));
  for (var n = t; n--; ) {
    var r = e.times(e);
    e = r.times(r).minus(r).times(8).plus(1);
  }
  return o.precision -= t, e;
}
var q = /* @__PURE__ */ (function() {
  function o(i, s, n) {
    var r, a = 0, l = i.length;
    for (i = i.slice(); l--; )
      r = i[l] * s + a, i[l] = r % n | 0, a = r / n | 0;
    return a && i.unshift(a), i;
  }
  function e(i, s, n, r) {
    var a, l;
    if (n != r)
      l = n > r ? 1 : -1;
    else
      for (a = l = 0; a < n; a++)
        if (i[a] != s[a]) {
          l = i[a] > s[a] ? 1 : -1;
          break;
        }
    return l;
  }
  function t(i, s, n, r) {
    for (var a = 0; n--; )
      i[n] -= a, a = i[n] < s[n] ? 1 : 0, i[n] = a * r + i[n] - s[n];
    for (; !i[0] && i.length > 1; ) i.shift();
  }
  return function(i, s, n, r, a, l) {
    var h, d, c, u, f, m, p, v, b, k, S, F, _, j, J, U, $, fe, Y, T, I = i.constructor, Z = i.s == s.s ? 1 : -1, X = i.d, W = s.d;
    if (!X || !X[0] || !W || !W[0])
      return new I(
        // Return NaN if either NaN, or both Infinity or 0.
        !i.s || !s.s || (X ? W && X[0] == W[0] : !W) ? NaN : (
          // Return ±0 if x is 0 or y is ±Infinity, or return ±Infinity as y is 0.
          X && X[0] == 0 || !W ? Z * 0 : Z / 0
        )
      );
    for (l ? (f = 1, d = i.e - s.e) : (l = me, f = O, d = oe(i.e / f) - oe(s.e / f)), Y = W.length, $ = X.length, b = new I(Z), k = b.d = [], c = 0; W[c] == (X[c] || 0); c++) ;
    if (W[c] > (X[c] || 0) && d--, n == null ? (j = n = I.precision, r = I.rounding) : a ? j = n + (i.e - s.e) + 1 : j = n, j < 0)
      k.push(1), m = !0;
    else {
      if (j = j / f + 2 | 0, c = 0, Y == 1) {
        for (u = 0, W = W[0], j++; (c < $ || u) && j--; c++)
          J = u * l + (X[c] || 0), k[c] = J / W | 0, u = J % W | 0;
        m = u || c < $;
      } else {
        for (u = l / (W[0] + 1) | 0, u > 1 && (W = o(W, u, l), X = o(X, u, l), Y = W.length, $ = X.length), U = Y, S = X.slice(0, Y), F = S.length; F < Y; ) S[F++] = 0;
        T = W.slice(), T.unshift(0), fe = W[0], W[1] >= l / 2 && ++fe;
        do
          u = 0, h = e(W, S, Y, F), h < 0 ? (_ = S[0], Y != F && (_ = _ * l + (S[1] || 0)), u = _ / fe | 0, u > 1 ? (u >= l && (u = l - 1), p = o(W, u, l), v = p.length, F = S.length, h = e(p, S, v, F), h == 1 && (u--, t(p, Y < v ? T : W, v, l))) : (u == 0 && (h = u = 1), p = W.slice()), v = p.length, v < F && p.unshift(0), t(S, p, F, l), h == -1 && (F = S.length, h = e(W, S, Y, F), h < 1 && (u++, t(S, Y < F ? T : W, F, l))), F = S.length) : h === 0 && (u++, S = [0]), k[c++] = u, h && S[0] ? S[F++] = X[U] || 0 : (S = [X[U]], F = 1);
        while ((U++ < $ || S[0] !== void 0) && j--);
        m = S[0] !== void 0;
      }
      k[0] || k.shift();
    }
    if (f == 1)
      b.e = d, ms = m;
    else {
      for (c = 1, u = k[0]; u >= 10; u /= 10) c++;
      b.e = c + d * f - 1, H(b, a ? n + b.e + 1 : n, r, m);
    }
    return b;
  };
})();
function H(o, e, t, i) {
  var s, n, r, a, l, h, d, c, u, f = o.constructor;
  e: if (e != null) {
    if (c = o.d, !c) return o;
    for (s = 1, a = c[0]; a >= 10; a /= 10) s++;
    if (n = e - s, n < 0)
      n += O, r = e, d = c[u = 0], l = d / Q(10, s - r - 1) % 10 | 0;
    else if (u = Math.ceil((n + 1) / O), a = c.length, u >= a)
      if (i) {
        for (; a++ <= u; ) c.push(0);
        d = l = 0, s = 1, n %= O, r = n - O + 1;
      } else
        break e;
    else {
      for (d = a = c[u], s = 1; a >= 10; a /= 10) s++;
      n %= O, r = n - O + s, l = r < 0 ? 0 : d / Q(10, s - r - 1) % 10 | 0;
    }
    if (i = i || e < 0 || c[u + 1] !== void 0 || (r < 0 ? d : d % Q(10, s - r - 1)), h = t < 4 ? (l || i) && (t == 0 || t == (o.s < 0 ? 3 : 2)) : l > 5 || l == 5 && (t == 4 || i || t == 6 && // Check whether the digit to the left of the rounding digit is odd.
    (n > 0 ? r > 0 ? d / Q(10, s - r) : 0 : c[u - 1]) % 10 & 1 || t == (o.s < 0 ? 8 : 7)), e < 1 || !c[0])
      return c.length = 0, h ? (e -= o.e + 1, c[0] = Q(10, (O - e % O) % O), o.e = -e || 0) : c[0] = o.e = 0, o;
    if (n == 0 ? (c.length = u, a = 1, u--) : (c.length = u + 1, a = Q(10, O - n), c[u] = r > 0 ? (d / Q(10, s - r) % Q(10, r) | 0) * a : 0), h)
      for (; ; )
        if (u == 0) {
          for (n = 1, r = c[0]; r >= 10; r /= 10) n++;
          for (r = c[0] += a, a = 1; r >= 10; r /= 10) a++;
          n != a && (o.e++, c[0] == me && (c[0] = 1));
          break;
        } else {
          if (c[u] += a, c[u] != me) break;
          c[u--] = 0, a = 1;
        }
    for (n = c.length; c[--n] === 0; ) c.pop();
  }
  return P && (o.e > f.maxE ? (o.d = null, o.e = NaN) : o.e < f.minE && (o.e = 0, o.d = [0])), o;
}
function Ee(o, e, t) {
  if (!o.isFinite()) return Rs(o);
  var i, s = o.e, n = ne(o.d), r = n.length;
  return e ? (t && (i = t - r) > 0 ? n = n.charAt(0) + "." + n.slice(1) + Le(i) : r > 1 && (n = n.charAt(0) + "." + n.slice(1)), n = n + (o.e < 0 ? "e" : "e+") + o.e) : s < 0 ? (n = "0." + Le(-s - 1) + n, t && (i = t - r) > 0 && (n += Le(i))) : s >= r ? (n += Le(s + 1 - r), t && (i = t - s - 1) > 0 && (n = n + "." + Le(i))) : ((i = s + 1) < r && (n = n.slice(0, i) + "." + n.slice(i)), t && (i = t - r) > 0 && (s + 1 === r && (n += "."), n += Le(i))), n;
}
function Dt(o, e) {
  var t = o[0];
  for (e *= O; t >= 10; t /= 10) e++;
  return e;
}
function kt(o, e, t) {
  if (e > fo)
    throw P = !0, t && (o.precision = t), Error(gs);
  return H(new o(Rt), e, 1, !0);
}
function Ce(o, e, t) {
  if (e > wi) throw Error(gs);
  return H(new o(xt), e, t, !0);
}
function Cs(o) {
  var e = o.length - 1, t = e * O + 1;
  if (e = o[e], e) {
    for (; e % 10 == 0; e /= 10) t--;
    for (e = o[0]; e >= 10; e /= 10) t++;
  }
  return t;
}
function Le(o) {
  for (var e = ""; o--; ) e += "0";
  return e;
}
function Es(o, e, t, i) {
  var s, n = new o(1), r = Math.ceil(i / O + 4);
  for (P = !1; ; ) {
    if (t % 2 && (n = n.times(e), Bi(n.d, r) && (s = !0)), t = oe(t / 2), t === 0) {
      t = n.d.length - 1, s && n.d[t] === 0 && ++n.d[t];
      break;
    }
    e = e.times(e), Bi(e.d, r);
  }
  return P = !0, n;
}
function Ni(o) {
  return o.d[o.d.length - 1] & 1;
}
function ys(o, e, t) {
  for (var i, s, n = new o(e[0]), r = 0; ++r < e.length; ) {
    if (s = new o(e[r]), !s.s) {
      n = s;
      break;
    }
    i = n.cmp(s), (i === t || i === 0 && n.s === t) && (n = s);
  }
  return n;
}
function Ci(o, e) {
  var t, i, s, n, r, a, l, h = 0, d = 0, c = 0, u = o.constructor, f = u.rounding, m = u.precision;
  if (!o.d || !o.d[0] || o.e > 17)
    return new u(o.d ? o.d[0] ? o.s < 0 ? 0 : 1 / 0 : 1 : o.s ? o.s < 0 ? 0 : o : NaN);
  for (e == null ? (P = !1, l = m) : l = e, a = new u(0.03125); o.e > -2; )
    o = o.times(a), c += 5;
  for (i = Math.log(Q(2, c)) / Math.LN10 * 2 + 5 | 0, l += i, t = n = r = new u(1), u.precision = l; ; ) {
    if (n = H(n.times(o), l, 1), t = t.times(++d), a = r.plus(q(n, t, l, 1)), ne(a.d).slice(0, l) === ne(r.d).slice(0, l)) {
      for (s = c; s--; ) r = H(r.times(r), l, 1);
      if (e == null)
        if (h < 3 && ct(r.d, l - i, f, h))
          u.precision = l += 10, t = n = a = new u(1), d = 0, h++;
        else
          return H(r, u.precision = m, f, P = !0);
      else
        return u.precision = m, r;
    }
    r = a;
  }
}
function Oe(o, e) {
  var t, i, s, n, r, a, l, h, d, c, u, f = 1, m = 10, p = o, v = p.d, b = p.constructor, k = b.rounding, S = b.precision;
  if (p.s < 0 || !v || !v[0] || !p.e && v[0] == 1 && v.length == 1)
    return new b(v && !v[0] ? -1 / 0 : p.s != 1 ? NaN : v ? 0 : p);
  if (e == null ? (P = !1, d = S) : d = e, b.precision = d += m, t = ne(v), i = t.charAt(0), Math.abs(n = p.e) < 15e14) {
    for (; i < 7 && i != 1 || i == 1 && t.charAt(1) > 3; )
      p = p.times(o), t = ne(p.d), i = t.charAt(0), f++;
    n = p.e, i > 1 ? (p = new b("0." + t), n++) : p = new b(i + "." + t.slice(1));
  } else
    return h = kt(b, d + 2, S).times(n + ""), p = Oe(new b(i + "." + t.slice(1)), d - m).plus(h), b.precision = S, e == null ? H(p, S, k, P = !0) : p;
  for (c = p, l = r = p = q(p.minus(1), p.plus(1), d, 1), u = H(p.times(p), d, 1), s = 3; ; ) {
    if (r = H(r.times(u), d, 1), h = l.plus(q(r, new b(s), d, 1)), ne(h.d).slice(0, d) === ne(l.d).slice(0, d))
      if (l = l.times(2), n !== 0 && (l = l.plus(kt(b, d + 2, S).times(n + ""))), l = q(l, new b(f), d, 1), e == null)
        if (ct(l.d, d - m, k, a))
          b.precision = d += m, h = r = p = q(c.minus(1), c.plus(1), d, 1), u = H(p.times(p), d, 1), s = a = 1;
        else
          return H(l, b.precision = S, k, P = !0);
      else
        return b.precision = S, l;
    l = h, s += 2;
  }
}
function Rs(o) {
  return String(o.s * o.s / 0);
}
function Et(o, e) {
  var t, i, s;
  for ((t = e.indexOf(".")) > -1 && (e = e.replace(".", "")), (i = e.search(/e/i)) > 0 ? (t < 0 && (t = i), t += +e.slice(i + 1), e = e.substring(0, i)) : t < 0 && (t = e.length), i = 0; e.charCodeAt(i) === 48; i++) ;
  for (s = e.length; e.charCodeAt(s - 1) === 48; --s) ;
  if (e = e.slice(i, s), e) {
    if (s -= i, o.e = t = t - i - 1, o.d = [], i = (t + 1) % O, t < 0 && (i += O), i < s) {
      for (i && o.d.push(+e.slice(0, i)), s -= O; i < s; ) o.d.push(+e.slice(i, i += O));
      e = e.slice(i), i = O - e.length;
    } else
      i -= s;
    for (; i--; ) e += "0";
    o.d.push(+e), P && (o.e > o.constructor.maxE ? (o.d = null, o.e = NaN) : o.e < o.constructor.minE && (o.e = 0, o.d = [0]));
  } else
    o.e = 0, o.d = [0];
  return o;
}
function mo(o, e) {
  var t, i, s, n, r, a, l, h, d;
  if (e.indexOf("_") > -1) {
    if (e = e.replace(/(\d)_(?=\d)/g, "$1"), ws.test(e)) return Et(o, e);
  } else if (e === "Infinity" || e === "NaN")
    return +e || (o.s = NaN), o.e = NaN, o.d = null, o;
  if (ho.test(e))
    t = 16, e = e.toLowerCase();
  else if (lo.test(e))
    t = 2;
  else if (uo.test(e))
    t = 8;
  else
    throw Error(Pe + e);
  for (n = e.search(/p/i), n > 0 ? (l = +e.slice(n + 1), e = e.substring(2, n)) : e = e.slice(2), n = e.indexOf("."), r = n >= 0, i = o.constructor, r && (e = e.replace(".", ""), a = e.length, n = a - n, s = Es(i, new i(t), n, n * 2)), h = Ct(e, t, me), d = h.length - 1, n = d; h[n] === 0; --n) h.pop();
  return n < 0 ? new i(o.s * 0) : (o.e = Dt(h, d), o.d = h, P = !1, r && (o = q(o, s, a * 4)), l && (o = o.times(Math.abs(l) < 54 ? Q(2, l) : ee.pow(2, l))), P = !0, o);
}
function go(o, e) {
  var t, i = e.d.length;
  if (i < 3)
    return e.isZero() ? e : et(o, 2, e, e);
  t = 1.4 * Math.sqrt(i), t = t > 16 ? 16 : t | 0, e = e.times(1 / zt(5, t)), e = et(o, 2, e, e);
  for (var s, n = new o(5), r = new o(16), a = new o(20); t--; )
    s = e.times(e), e = e.times(n.plus(s.times(r.times(s).minus(a))));
  return e;
}
function et(o, e, t, i, s) {
  var n, r, a, l, h = o.precision, d = Math.ceil(h / O);
  for (P = !1, l = t.times(t), a = new o(i); ; ) {
    if (r = q(a.times(l), new o(e++ * e++), h, 1), a = s ? i.plus(r) : i.minus(r), i = q(r.times(l), new o(e++ * e++), h, 1), r = a.plus(i), r.d[d] !== void 0) {
      for (n = d; r.d[n] === a.d[n] && n--; ) ;
      if (n == -1) break;
    }
    n = a, a = i, i = r, r = n;
  }
  return P = !0, r.d.length = d + 1, r;
}
function zt(o, e) {
  for (var t = o; --e; ) t *= o;
  return t;
}
function xs(o, e) {
  var t, i = e.s < 0, s = Ce(o, o.precision, 1), n = s.times(0.5);
  if (e = e.abs(), e.lte(n))
    return Te = i ? 4 : 1, e;
  if (t = e.divToInt(s), t.isZero())
    Te = i ? 3 : 2;
  else {
    if (e = e.minus(t.times(s)), e.lte(n))
      return Te = Ni(t) ? i ? 2 : 3 : i ? 4 : 1, e;
    Te = Ni(t) ? i ? 1 : 4 : i ? 3 : 2;
  }
  return e.minus(s).abs();
}
function xi(o, e, t, i) {
  var s, n, r, a, l, h, d, c, u, f = o.constructor, m = t !== void 0;
  if (m ? (he(t, 1, _e), i === void 0 ? i = f.rounding : he(i, 0, 8)) : (t = f.precision, i = f.rounding), !o.isFinite())
    d = Rs(o);
  else {
    for (d = Ee(o), r = d.indexOf("."), m ? (s = 2, e == 16 ? t = t * 4 - 3 : e == 8 && (t = t * 3 - 2)) : s = e, r >= 0 && (d = d.replace(".", ""), u = new f(1), u.e = d.length - r, u.d = Ct(Ee(u), 10, s), u.e = u.d.length), c = Ct(d, 10, s), n = l = c.length; c[--l] == 0; ) c.pop();
    if (!c[0])
      d = m ? "0p+0" : "0";
    else {
      if (r < 0 ? n-- : (o = new f(o), o.d = c, o.e = n, o = q(o, u, t, i, 0, s), c = o.d, n = o.e, h = ms), r = c[t], a = s / 2, h = h || c[t + 1] !== void 0, h = i < 4 ? (r !== void 0 || h) && (i === 0 || i === (o.s < 0 ? 3 : 2)) : r > a || r === a && (i === 4 || h || i === 6 && c[t - 1] & 1 || i === (o.s < 0 ? 8 : 7)), c.length = t, h)
        for (; ++c[--t] > s - 1; )
          c[t] = 0, t || (++n, c.unshift(1));
      for (l = c.length; !c[l - 1]; --l) ;
      for (r = 0, d = ""; r < l; r++) d += bi.charAt(c[r]);
      if (m) {
        if (l > 1)
          if (e == 16 || e == 8) {
            for (r = e == 16 ? 4 : 3, --l; l % r; l++) d += "0";
            for (c = Ct(d, s, e), l = c.length; !c[l - 1]; --l) ;
            for (r = 1, d = "1."; r < l; r++) d += bi.charAt(c[r]);
          } else
            d = d.charAt(0) + "." + d.slice(1);
        d = d + (n < 0 ? "p" : "p+") + n;
      } else if (n < 0) {
        for (; ++n; ) d = "0" + d;
        d = "0." + d;
      } else if (++n > l) for (n -= l; n--; ) d += "0";
      else n < l && (d = d.slice(0, n) + "." + d.slice(n));
    }
    d = (e == 16 ? "0x" : e == 2 ? "0b" : e == 8 ? "0o" : "") + d;
  }
  return o.s < 0 ? "-" + d : d;
}
function Bi(o, e) {
  if (o.length > e)
    return o.length = e, !0;
}
function bo(o) {
  return new this(o).abs();
}
function vo(o) {
  return new this(o).acos();
}
function wo(o) {
  return new this(o).acosh();
}
function Co(o, e) {
  return new this(o).plus(e);
}
function Eo(o) {
  return new this(o).asin();
}
function yo(o) {
  return new this(o).asinh();
}
function Ro(o) {
  return new this(o).atan();
}
function xo(o) {
  return new this(o).atanh();
}
function ko(o, e) {
  o = new this(o), e = new this(e);
  var t, i = this.precision, s = this.rounding, n = i + 4;
  return !o.s || !e.s ? t = new this(NaN) : !o.d && !e.d ? (t = Ce(this, n, 1).times(e.s > 0 ? 0.25 : 0.75), t.s = o.s) : !e.d || o.isZero() ? (t = e.s < 0 ? Ce(this, i, s) : new this(0), t.s = o.s) : !o.d || e.isZero() ? (t = Ce(this, n, 1).times(0.5), t.s = o.s) : e.s < 0 ? (this.precision = n, this.rounding = 1, t = this.atan(q(o, e, n, 1)), e = Ce(this, n, 1), this.precision = i, this.rounding = s, t = o.s < 0 ? t.minus(e) : t.plus(e)) : t = this.atan(q(o, e, n, 1)), t;
}
function To(o) {
  return new this(o).cbrt();
}
function Mo(o) {
  return H(o = new this(o), o.e + 1, 2);
}
function Lo(o, e, t) {
  return new this(o).clamp(e, t);
}
function So(o) {
  if (!o || typeof o != "object") throw Error(St + "Object expected");
  var e, t, i, s = o.defaults === !0, n = [
    "precision",
    1,
    _e,
    "rounding",
    0,
    8,
    "toExpNeg",
    -Je,
    0,
    "toExpPos",
    0,
    Je,
    "maxE",
    0,
    Je,
    "minE",
    -Je,
    0,
    "modulo",
    0,
    9
  ];
  for (e = 0; e < n.length; e += 3)
    if (t = n[e], s && (this[t] = vi[t]), (i = o[t]) !== void 0)
      if (oe(i) === i && i >= n[e + 1] && i <= n[e + 2]) this[t] = i;
      else throw Error(Pe + t + ": " + i);
  if (t = "crypto", s && (this[t] = vi[t]), (i = o[t]) !== void 0)
    if (i === !0 || i === !1 || i === 0 || i === 1)
      if (i)
        if (typeof crypto < "u" && crypto && (crypto.getRandomValues || crypto.randomBytes))
          this[t] = !0;
        else
          throw Error(bs);
      else
        this[t] = !1;
    else
      throw Error(Pe + t + ": " + i);
  return this;
}
function Do(o) {
  return new this(o).cos();
}
function zo(o) {
  return new this(o).cosh();
}
function ks(o) {
  var e, t, i;
  function s(n) {
    var r, a, l, h = this;
    if (!(h instanceof s)) return new s(n);
    if (h.constructor = s, Ii(n)) {
      h.s = n.s, P ? !n.d || n.e > s.maxE ? (h.e = NaN, h.d = null) : n.e < s.minE ? (h.e = 0, h.d = [0]) : (h.e = n.e, h.d = n.d.slice()) : (h.e = n.e, h.d = n.d ? n.d.slice() : n.d);
      return;
    }
    if (l = typeof n, l === "number") {
      if (n === 0) {
        h.s = 1 / n < 0 ? -1 : 1, h.e = 0, h.d = [0];
        return;
      }
      if (n < 0 ? (n = -n, h.s = -1) : h.s = 1, n === ~~n && n < 1e7) {
        for (r = 0, a = n; a >= 10; a /= 10) r++;
        P ? r > s.maxE ? (h.e = NaN, h.d = null) : r < s.minE ? (h.e = 0, h.d = [0]) : (h.e = r, h.d = [n]) : (h.e = r, h.d = [n]);
        return;
      }
      if (n * 0 !== 0) {
        n || (h.s = NaN), h.e = NaN, h.d = null;
        return;
      }
      return Et(h, n.toString());
    }
    if (l === "string")
      return (a = n.charCodeAt(0)) === 45 ? (n = n.slice(1), h.s = -1) : (a === 43 && (n = n.slice(1)), h.s = 1), ws.test(n) ? Et(h, n) : mo(h, n);
    if (l === "bigint")
      return n < 0 ? (n = -n, h.s = -1) : h.s = 1, Et(h, n.toString());
    throw Error(Pe + n);
  }
  if (s.prototype = y, s.ROUND_UP = 0, s.ROUND_DOWN = 1, s.ROUND_CEIL = 2, s.ROUND_FLOOR = 3, s.ROUND_HALF_UP = 4, s.ROUND_HALF_DOWN = 5, s.ROUND_HALF_EVEN = 6, s.ROUND_HALF_CEIL = 7, s.ROUND_HALF_FLOOR = 8, s.EUCLID = 9, s.config = s.set = So, s.clone = ks, s.isDecimal = Ii, s.abs = bo, s.acos = vo, s.acosh = wo, s.add = Co, s.asin = Eo, s.asinh = yo, s.atan = Ro, s.atanh = xo, s.atan2 = ko, s.cbrt = To, s.ceil = Mo, s.clamp = Lo, s.cos = Do, s.cosh = zo, s.div = Fo, s.exp = Ho, s.floor = Ao, s.hypot = Oo, s.ln = Po, s.log = _o, s.log10 = Bo, s.log2 = No, s.max = Io, s.min = Vo, s.mod = Wo, s.mul = jo, s.pow = Go, s.random = Uo, s.round = $o, s.sign = qo, s.sin = Ko, s.sinh = Jo, s.sqrt = Xo, s.sub = Yo, s.sum = Zo, s.tan = Qo, s.tanh = ea, s.trunc = ta, o === void 0 && (o = {}), o && o.defaults !== !0)
    for (i = ["precision", "rounding", "toExpNeg", "toExpPos", "maxE", "minE", "modulo", "crypto"], e = 0; e < i.length; ) o.hasOwnProperty(t = i[e++]) || (o[t] = this[t]);
  return s.config(o), s;
}
function Fo(o, e) {
  return new this(o).div(e);
}
function Ho(o) {
  return new this(o).exp();
}
function Ao(o) {
  return H(o = new this(o), o.e + 1, 3);
}
function Oo() {
  var o, e, t = new this(0);
  for (P = !1, o = 0; o < arguments.length; )
    if (e = new this(arguments[o++]), e.d)
      t.d && (t = t.plus(e.times(e)));
    else {
      if (e.s)
        return P = !0, new this(1 / 0);
      t = e;
    }
  return P = !0, t.sqrt();
}
function Ii(o) {
  return o instanceof ee || o && o.toStringTag === vs || !1;
}
function Po(o) {
  return new this(o).ln();
}
function _o(o, e) {
  return new this(o).log(e);
}
function No(o) {
  return new this(o).log(2);
}
function Bo(o) {
  return new this(o).log(10);
}
function Io() {
  return ys(this, arguments, -1);
}
function Vo() {
  return ys(this, arguments, 1);
}
function Wo(o, e) {
  return new this(o).mod(e);
}
function jo(o, e) {
  return new this(o).mul(e);
}
function Go(o, e) {
  return new this(o).pow(e);
}
function Uo(o) {
  var e, t, i, s, n = 0, r = new this(1), a = [];
  if (o === void 0 ? o = this.precision : he(o, 1, _e), i = Math.ceil(o / O), this.crypto)
    if (crypto.getRandomValues)
      for (e = crypto.getRandomValues(new Uint32Array(i)); n < i; )
        s = e[n], s >= 429e7 ? e[n] = crypto.getRandomValues(new Uint32Array(1))[0] : a[n++] = s % 1e7;
    else if (crypto.randomBytes) {
      for (e = crypto.randomBytes(i *= 4); n < i; )
        s = e[n] + (e[n + 1] << 8) + (e[n + 2] << 16) + ((e[n + 3] & 127) << 24), s >= 214e7 ? crypto.randomBytes(4).copy(e, n) : (a.push(s % 1e7), n += 4);
      n = i / 4;
    } else
      throw Error(bs);
  else for (; n < i; ) a[n++] = Math.random() * 1e7 | 0;
  for (i = a[--n], o %= O, i && o && (s = Q(10, O - o), a[n] = (i / s | 0) * s); a[n] === 0; n--) a.pop();
  if (n < 0)
    t = 0, a = [0];
  else {
    for (t = -1; a[0] === 0; t -= O) a.shift();
    for (i = 1, s = a[0]; s >= 10; s /= 10) i++;
    i < O && (t -= O - i);
  }
  return r.e = t, r.d = a, r;
}
function $o(o) {
  return H(o = new this(o), o.e + 1, this.rounding);
}
function qo(o) {
  return o = new this(o), o.d ? o.d[0] ? o.s : 0 * o.s : o.s || NaN;
}
function Ko(o) {
  return new this(o).sin();
}
function Jo(o) {
  return new this(o).sinh();
}
function Xo(o) {
  return new this(o).sqrt();
}
function Yo(o, e) {
  return new this(o).sub(e);
}
function Zo() {
  var o = 0, e = arguments, t = new this(e[o]);
  for (P = !1; t.s && ++o < e.length; ) t = t.plus(e[o]);
  return P = !0, H(t, this.precision, this.rounding);
}
function Qo(o) {
  return new this(o).tan();
}
function ea(o) {
  return new this(o).tanh();
}
function ta(o) {
  return H(o = new this(o), o.e + 1, 1);
}
y[Symbol.for("nodejs.util.inspect.custom")] = y.toString;
y[Symbol.toStringTag] = "Decimal";
var ee = y.constructor = ks(vi);
Rt = new ee(Rt);
xt = new ee(xt);
ee.set({ precision: 28, rounding: ee.ROUND_HALF_EVEN });
class N extends Error {
  constructor(e, t = "Invalid formula") {
    super(t), this.code = e;
  }
}
const ia = new Set("IF IFERROR ROUND ABS MIN MAX SUM AVG COUNT UPPER LOWER CONCAT TODAY YEAR MONTH DAY ISNULL IFNULL COALESCE QSUM QAVG QCOUNT".split(" ")), Gt = /\s*(?:(\d+(?:\.\d*)?(?:[eE][+-]?\d+)?|\.\d+)|("(?:[^"]|"")*")|\[([A-Za-z_][A-Za-z_0-9]*)\]|(\$?[A-Za-z]+\$?[1-9][0-9]*)|([A-Za-z_][A-Za-z_0-9]*)|(<=|>=|<>|!=|[+\-*/^&=<>():,]))/y;
function Ts(o, e = 500, t = 10) {
  var u;
  if (typeof o != "string" || o.length > e) throw new N("#LIMIT!");
  const i = o.startsWith("=") ? o.slice(1) : o, s = [];
  let n = 0;
  for (; n < i.length && i.slice(n).trim(); ) {
    Gt.lastIndex = n;
    const f = Gt.exec(i);
    if (!f) throw new N("#NAME?", "Invalid token");
    const m = f.slice(1).findIndex((p) => p !== void 0);
    s.push([m, f[m + 1]]), n = Gt.lastIndex;
  }
  s.push([5, "EOF"]);
  let r = 0;
  const a = () => {
    if (!s[r]) throw new N("#VALUE!");
    return s[r++];
  }, l = (f) => {
    if (a()[1] !== f) throw new N("#VALUE!");
  }, h = (f = 0, m = 0) => {
    var S, F, _, j;
    if (m > t) throw new N("#LIMIT!");
    const [p, v] = a();
    let b;
    if (p === 0) b = ["number", v];
    else if (p === 1) b = ["string", v.slice(1, -1).replaceAll('""', '"')];
    else if (p === 2) b = ["field", v];
    else if (p === 3) b = ["cell", v.toUpperCase()];
    else if (p === 4) {
      const J = v.toUpperCase();
      if (((S = s[r]) == null ? void 0 : S[1]) === "(") {
        if (!ia.has(J)) throw new N("#NAME?");
        a();
        const U = [];
        if (((F = s[r]) == null ? void 0 : F[1]) !== ")")
          for (; U.push(h(0, m + 1)), ((_ = s[r]) == null ? void 0 : _[1]) === ","; )
            a();
        l(")"), b = ["call", J, U];
      } else ["TRUE", "FALSE", "NULL"].includes(J) ? b = ["literal", J === "NULL" ? null : J === "TRUE"] : b = ["column", v];
    } else if (["+", "-"].includes(v)) b = ["unary", v, h(40, m + 1)];
    else if (v === "(")
      b = h(0, m + 1), l(")");
    else throw new N("#VALUE!");
    const k = { "=": 10, "<>": 10, "!=": 10, "<": 10, ">": 10, "<=": 10, ">=": 10, "&": 15, "+": 20, "-": 20, "*": 30, "/": 30, "^": 40, ":": 50 };
    for (; ((j = s[r]) == null ? void 0 : j[1]) in k && k[s[r][1]] >= f; ) {
      const J = a()[1], U = k[J];
      b = [J === ":" ? "range" : "binary", J, b, h(J === "^" ? U : U + 1, m + 1)];
    }
    return b;
  }, d = h();
  if (((u = s[r]) == null ? void 0 : u[1]) !== "EOF") throw new N("#VALUE!");
  const c = (f, m = 0) => {
    if (m > t) throw new N("#LIMIT!");
    f[0] === "call" && f[2].forEach((p) => c(p, m + 1)), ["binary", "range"].includes(f[0]) && (c(f[2], m + 1), c(f[3], m + 1)), f[0] === "unary" && c(f[2], m + 1);
  };
  return c(d), d;
}
function sa(o) {
  const e = { fields: /* @__PURE__ */ new Set(), cells: /* @__PURE__ */ new Set(), columns: /* @__PURE__ */ new Set(), query: !1 }, t = (i) => {
    i[0] === "field" ? e.fields.add(i[1]) : i[0] === "cell" ? e.cells.add(i[1]) : i[0] === "column" ? e.columns.add(i[1]) : i[0] === "call" ? (e.query || (e.query = i[1].startsWith("Q")), i[2].forEach(t)) : ["binary", "range"].includes(i[0]) ? (t(i[2]), t(i[3])) : i[0] === "unary" && t(i[2]);
  };
  return t(o), e;
}
function we(o) {
  if (o == null) throw new N("#N/A");
  try {
    if (typeof o == "boolean" && (o = o ? 1 : 0), !["string", "number"].includes(typeof o) && !ee.isDecimal(o)) throw new Error();
    const e = new ee(o);
    if (!e.isFinite()) throw new Error();
    return e;
  } catch {
    throw new N("#VALUE!");
  }
}
function nt(o) {
  return o == null ? "" : typeof o == "boolean" ? o ? "TRUE" : "FALSE" : String(o);
}
function Vi(o, e) {
  const t = [];
  for (const s of e)
    if (!(s === null || s === "" || typeof s == "boolean"))
      try {
        t.push(we(s));
      } catch {
      }
  if (o === "COUNT") return new ee(t.length);
  const i = () => t.reduce((s, n) => s.plus(n), new ee(0));
  if (o === "SUM") return i();
  if (!t.length) throw new N("#N/A");
  return o === "AVG" ? i().div(t.length) : o === "MIN" ? ee.min(...t) : ee.max(...t);
}
function Ms(o, e = {}) {
  let t = 0;
  const i = performance.now() + (e.timeoutMs ?? 250), s = (a = 1) => {
    if (t += a, t > (e.maxSteps ?? 1e4) || performance.now() > i) throw new N("#LIMIT!");
  }, n = (a, l, h = 1 / 0) => {
    if (a.length < l || a.length > h) throw new N("#VALUE!");
  }, r = (a) => {
    s();
    const l = a[0];
    if (l === "number") return we(a[1]);
    if (l === "string" || l === "literal") return a[1];
    if (l === "field") {
      if (!Object.hasOwn(e.fields ?? {}, a[1])) throw new N("#REF!");
      return e.fields[a[1]];
    }
    if (l === "column") {
      if (!e.column) throw new N("#REF!");
      return e.column(a[1]);
    }
    if (l === "cell") {
      if (!e.cell) throw new N("#REF!");
      return e.cell(a[1]);
    }
    if (l === "range") {
      if (a[2][0] !== "cell" || a[3][0] !== "cell" || !e.cell) throw new N("#REF!");
      const u = e.cell(a[2][1], a[3][1]);
      return s(u.length), u;
    }
    if (l === "unary") return we(r(a[2])).times(a[1] === "-" ? -1 : 1);
    if (l === "binary") {
      const u = a[1];
      let f = r(a[2]), m = r(a[3]);
      if (u === "&") return nt(f) + nt(m);
      if (["=", "!=", "<>", "<", ">", "<=", ">="].includes(u)) {
        if (f === null || m === null) {
          if (u === "=") return f === m;
          if (u === "!=" || u === "<>") return f !== m;
          throw new N("#N/A");
        }
        let p;
        return typeof f == "number" || typeof m == "number" || ee.isDecimal(f) || ee.isDecimal(m) ? p = we(f).cmp(we(m)) : p = f === m ? 0 : f < m ? -1 : 1, { "=": p === 0, "!=": p !== 0, "<>": p !== 0, "<": p < 0, ">": p > 0, "<=": p <= 0, ">=": p >= 0 }[u];
      }
      if (f = we(f), m = we(m), u === "+") return f.plus(m);
      if (u === "-") return f.minus(m);
      if (u === "*") return f.times(m);
      if (u === "/") {
        if (m.isZero()) throw new N("#DIV/0!");
        return f.div(m);
      }
      if (u === "^") {
        if (!m.isInteger() || m.abs().gt(100)) throw new N("#NUM!");
        return f.pow(m.toNumber());
      }
    }
    if (l !== "call") throw new N("#VALUE!");
    const h = a[1], d = a[2];
    if (h === "IF") {
      n(d, 3, 3);
      const u = r(d[0]);
      return r(d[na(u) ? 1 : 2]);
    }
    if (h === "IFERROR") {
      n(d, 2, 2);
      try {
        return r(d[0]);
      } catch (u) {
        if (!(u instanceof N) || u.code === "#LIMIT!") throw u;
        return r(d[1]);
      }
    }
    if (h === "COALESCE" || h === "IFNULL") {
      n(d, 2, h === "IFNULL" ? 2 : 1 / 0);
      for (const u of d) {
        const f = r(u);
        if (f !== null) return f;
      }
      return null;
    }
    if (h.startsWith("Q")) {
      if (n(d, 1, 1), !e.query || d[0][0] !== "field") throw new N("#REF!");
      const u = e.query(d[0][1]);
      return s(u.length), Vi(h.slice(1), u);
    }
    const c = d.map(r);
    if (["SUM", "AVG", "COUNT", "MIN", "MAX"].includes(h)) {
      n(d, 1);
      const u = c.flat();
      return s(u.length), Vi(h, u);
    }
    if (h === "TODAY")
      return n(d, 0, 0), e.today ?? (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    if (["YEAR", "MONTH", "DAY"].includes(h)) {
      n(d, 1, 1);
      const u = String(c[0]).slice(0, 10), f = /* @__PURE__ */ new Date(u + "T00:00:00Z");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(u) || Number.isNaN(f.getTime()) || f.toISOString().slice(0, 10) !== u) throw new N("#VALUE!");
      return new ee(h === "YEAR" ? f.getUTCFullYear() : h === "MONTH" ? f.getUTCMonth() + 1 : f.getUTCDate());
    }
    if (h === "ISNULL")
      return n(d, 1, 1), c[0] === null;
    if (h === "UPPER" || h === "LOWER")
      return n(d, 1, 1), h === "UPPER" ? nt(c[0]).toUpperCase() : nt(c[0]).toLowerCase();
    if (h === "CONCAT")
      return n(d, 1), c.map(nt).join("");
    if (h === "ABS")
      return n(d, 1, 1), we(c[0]).abs();
    if (h === "ROUND") {
      n(d, 1, 2);
      const u = d.length === 2 ? we(c[1]) : new ee(0);
      if (!u.isInteger() || u.abs().gt(20)) throw new N("#NUM!");
      const f = new ee(10).pow(u);
      return we(c[0]).times(f).toDecimalPlaces(0).div(f);
    }
    throw new N("#NAME?");
  };
  try {
    const a = r(o);
    if (ee.isDecimal(a) && (!a.isFinite() || Math.abs(a.e) > 1e3)) throw new N("#NUM!");
    return a;
  } catch (a) {
    throw a instanceof N ? a : new N("#VALUE!");
  }
}
function na(o) {
  return ee.isDecimal(o) ? !o.isZero() : !!o;
}
function Ei(o) {
  const e = /^\$?([A-Z]+)\$?([1-9][0-9]*)$/i.exec(o);
  if (!e) throw new N("#REF!");
  let t = 0;
  for (const i of e[1].toUpperCase()) t = t * 26 + i.charCodeAt(0) - 64;
  return [Number(e[2]) - 1, t - 1];
}
function yi(o) {
  let e = "";
  for (let t = o + 1; t > 0; t = Math.floor((t - 1) / 26)) e = String.fromCharCode(65 + (t - 1) % 26) + e;
  return e;
}
function Wi(o, e, t) {
  return o.startsWith("=") ? o.replace(
    /"(?:[^"]|"")*"|\[[^\]]*\]|(\$?)([A-Za-z]+)(\$?)([1-9][0-9]*)/g,
    (i, s, n, r, a) => {
      if (n === void 0) return i;
      const [l, h] = Ei(n + a), d = l + (r ? 0 : e), c = h + (s ? 0 : t);
      if (d < 0 || c < 0) throw new N("#REF!");
      return s + yi(c) + r + String(d + 1);
    }
  ) : o;
}
const vt = (o) => structuredClone(o);
class ji {
  constructor(e, t, i, s) {
    R(this, "changes", {});
    R(this, "past", []);
    R(this, "future", []);
    this.rows = e, this.columns = t, this.editable = i, this.today = s;
  }
  get dirty() {
    return Object.keys(this.changes).length > 0;
  }
  raw(e, t) {
    var i;
    return Object.hasOwn(this.changes[e] ?? {}, t) ? this.changes[e][t] : (i = this.rows.find((s) => s.pk === e)) == null ? void 0 : i.values[t];
  }
  transferValue(e, t) {
    const i = this.raw(e, t);
    return typeof i == "string" && i.startsWith("=") && !Object.hasOwn(this.changes[e] ?? {}, t) ? "'" + i : i;
  }
  apply(e) {
    var s;
    const t = vt(this.changes);
    let i = 0;
    for (const n of e) {
      const r = this.rows.find((a) => a.pk === n.pk);
      if (!r || !this.editable.has(n.field)) {
        i++;
        continue;
      }
      t[s = n.pk] ?? (t[s] = {}), n.value === r.values[n.field] ? delete t[n.pk][n.field] : t[n.pk][n.field] = n.value, Object.keys(t[n.pk]).length || delete t[n.pk];
    }
    return JSON.stringify(t) !== JSON.stringify(this.changes) && (this.past.push(vt(this.changes)), this.future = [], this.changes = t), i;
  }
  undo() {
    this.past.length && (this.future.push(vt(this.changes)), this.changes = this.past.pop());
  }
  redo() {
    this.future.length && (this.past.push(vt(this.changes)), this.changes = this.future.pop());
  }
  clear() {
    this.changes = {}, this.past = [], this.future = [];
  }
  payload() {
    return Object.entries(this.changes).map(([e, t]) => ({ pk: e, values: t, version: this.rows.find((i) => i.pk === e).version }));
  }
  value(e, t) {
    const i = /* @__PURE__ */ new Set(), s = /* @__PURE__ */ new Map(), n = (r, a) => {
      const l = JSON.stringify([r, a]);
      if (s.has(l)) return s.get(l);
      if (i.has(l)) throw new N("#CYCLE!");
      if (i.size > 100) throw new N("#LIMIT!");
      const h = this.rows.find((d) => d.pk === r);
      if (!h || !Object.hasOwn(h.values, a)) throw new N("#REF!");
      i.add(l);
      try {
        const d = this.raw(r, a);
        let c = d;
        const u = Object.hasOwn(this.changes[r] ?? {}, a);
        if (u && typeof d == "string" && d.startsWith("'=")) c = d.slice(1);
        else if (u && typeof d == "string" && d.startsWith("=")) {
          const f = Ts(d), m = sa(f);
          if ([...m.fields, ...m.columns].some((p) => !Object.hasOwn(h.values, p))) throw new N("#REF!");
          c = Ms(f, {
            fields: h.values,
            today: this.today,
            cell: (p, v) => {
              const b = Ei(p), k = Ei(v ?? p), S = [];
              if (Math.max(b[0], k[0]) >= this.rows.length || Math.max(b[1], k[1]) >= this.columns.length) throw new N("#REF!");
              for (let F = Math.min(b[0], k[0]); F <= Math.max(b[0], k[0]); F++)
                for (let _ = Math.min(b[1], k[1]); _ <= Math.max(b[1], k[1]); _++) S.push(n(this.rows[F].pk, this.columns[_]));
              return v ? S : S[0];
            },
            column: (p) => this.rows.map((v) => n(v.pk, p))
          });
        }
        return s.set(l, c), c;
      } finally {
        i.delete(l);
      }
    };
    return n(e, t);
  }
}
function ra(o) {
  const e = [], t = [];
  let i = "", s = !1;
  for (let n = 0; n < o.length; n++) {
    const r = o[n];
    r === '"' && (s || i === "") ? s && o[n + 1] === '"' ? (i += '"', n++) : s = !s : !s && (r === "	" || r === `
` || r === "\r") ? (t.push(i), i = "", r !== "	" && (e.push([...t]), t.length = 0, r === "\r" && o[n + 1] === `
` && n++)) : i += r;
  }
  return (i || t.length) && (t.push(i), e.push(t)), e;
}
function oa(o) {
  return o.map((e) => e.map((t) => {
    const i = t == null ? "" : String(t);
    return /[\t\r\n"]/.test(i) ? '"' + i.replaceAll('"', '""') + '"' : i;
  }).join("	")).join(`
`);
}
const aa = {
  Save: "Сохранить",
  Undo: "Отменить",
  Redo: "Повторить",
  "Fill down": "Заполнить вниз",
  Filters: "Фильтры",
  Columns: "Колонки",
  "Bulk change": "Массовое изменение",
  History: "История",
  "Ordinary Admin": "Обычный список",
  Search: "Поиск",
  Previous: "Назад",
  Next: "Далее",
  Ready: "Готово",
  Saving: "Сохранение",
  Saved: "Сохранено",
  Close: "Закрыть",
  Apply: "Применить",
  Cancel: "Отмена",
  Resume: "Продолжить",
  Preview: "Предпросмотр",
  Confirm: "Подтвердить",
  "Add condition": "Добавить условие",
  "Add group": "Добавить группу",
  Remove: "Удалить",
  "Add assignment": "Добавить присваивание",
  "All filtered rows": "Все найденные записи",
  "Selected rows on this page": "Выделенные строки на странице",
  "Save changes before continuing? Cancel discards changes.": "Сохранить изменения? «Отмена» — отбросить изменения.",
  "No rows selected": "Строки не выделены",
  "Unsaved changes": "Есть несохранённые изменения",
  "Readonly cells skipped": "Ячейки только для чтения пропущены",
  "Frozen columns": "Закреплённые колонки",
  "Value or formula": "Значение или формула",
  Loading: "Загрузка",
  "No matching records": "Записи не найдены",
  "Changed rows": "Изменено строк",
  "Keep editing": "Продолжить редактирование",
  Discard: "Отбросить",
  "Unsaved edits": "Несохранённые изменения",
  "Select all matching results in Bulk change": "Выбор всех результатов — в массовом изменении",
  Sort: "Сортировка",
  Ascending: "По возрастанию",
  Descending: "По убыванию",
  "Add sort": "Добавить сортировку",
  Details: "Подробности",
  Matched: "Найдено",
  Errors: "Ошибки",
  Status: "Статус",
  Before: "До",
  After: "После",
  Error: "Ошибка",
  preview: "Предпросмотр готов",
  preparing: "Подготовка",
  queued: "В очереди",
  running: "Выполняется",
  done: "Завершено",
  partial: "Завершено с ошибками",
  failed: "Ошибка выполнения",
  cancelled: "Отменено",
  pending: "Ожидает",
  dispatch_failed: "Ошибка очереди"
};
function la(o) {
  const e = globalThis.gettext;
  return (t) => typeof e == "function" ? e(t) : o.startsWith("ru") ? aa[t] ?? t : t;
}
const Ls = document.getElementById("modelsheet-state");
Ls && ha().catch((o) => {
  const e = document.getElementById("modelsheet-app");
  e && (e.textContent = String(o));
});
async function ha() {
  const o = JSON.parse(document.getElementById("modelsheet-config").textContent), e = la(o.language), t = document.getElementById("modelsheet-app");
  let i = JSON.parse(Ls.textContent);
  const s = new URL(location.href);
  if (s.searchParams.has("offset") || s.searchParams.has("filter")) {
    for (const g of ["filter", "sort", "columns"]) s.searchParams.has(g) && (i[g] = JSON.parse(s.searchParams.get(g)));
    for (const g of ["offset", "limit"]) s.searchParams.has(g) && (i[g] = Number(s.searchParams.get(g)));
    i.q = s.searchParams.get("q") ?? "";
  }
  const n = document.querySelector("[name=csrfmiddlewaretoken]").value, r = async (g, C) => {
    var M;
    const w = await fetch(o.base + g, {
      credentials: "same-origin",
      headers: C === void 0 ? {} : { "Content-Type": "application/json", "X-CSRFToken": n },
      method: C === void 0 ? "GET" : "POST",
      body: C === void 0 ? void 0 : JSON.stringify(C)
    }), E = await w.json();
    if (!w.ok) {
      const D = new Error(((M = E.error) == null ? void 0 : M.message) ?? `HTTP ${w.status}`);
      throw D.details = E.error, D;
    }
    return E;
  }, a = await r("schema/"), l = a.fields, h = a.computed, d = new Map(l.map((g) => [g.name, g])), c = new Set(l.filter((g) => g.editable).map((g) => g.name));
  let u = new ji([], [], c, ""), f = "", m, p, v, b, k = !1, S = null, F = !1, _ = null, j = "", J = 0, U = null;
  const $ = /* @__PURE__ */ new Map(), fe = /* @__PURE__ */ new Set(), Y = /* @__PURE__ */ new Set(), T = (g, C = "", w = "") => {
    const E = document.createElement(g);
    return E.textContent = C, E.className = w, E;
  }, I = (g, C, w, E = "") => {
    const M = T("button", e(g), E);
    return M.type = "button", M.addEventListener("click", () => {
      Promise.resolve().then(C).catch(ge);
    }), w.append(M), M;
  }, Z = T("div", "", "ms-toolbar");
  t.append(Z);
  const X = I("Save", Pt, Z, "ms-primary");
  I("Undo", () => {
    u.undo(), ve();
  }, Z), I("Redo", () => {
    u.redo(), ve();
  }, Z), I("Fill down", Di, Z);
  const W = T("input");
  W.type = "search", W.placeholder = e("Search"), W.value = i.q, W.setAttribute("aria-label", e("Search")), Z.append(W), W.addEventListener("keydown", (g) => {
    g.key === "Enter" && ye(async () => {
      i.q = W.value, i.offset = 0, await be();
    });
  }), I("Filters", Hs, Z), I("Sort", As, Z), I("Columns", Os, Z), a.can_bulk && I("Bulk change", () => ye(Ps), Z), a.can_history && I("History", _s, Z), I("Ordinary Admin", () => ye(async () => {
    const g = await r("admin-state/?" + At(i));
    location.href = g.url;
  }), Z);
  const pt = T("div", "", "ms-formula-bar");
  t.append(pt);
  const ki = T("output", "A1", "ms-address");
  pt.append(ki), pt.append(T("span", "ƒx", "ms-fx"));
  const Ge = T("input");
  Ge.setAttribute("aria-label", "Formula"), pt.append(Ge), Ge.addEventListener("keydown", (g) => {
    g.key === "Enter" && v && (Si(v.getRow().getData().__modelsheet_pk, v.getField(), Ge.value), v.getElement().tabIndex = 0, v.getElement().focus()), g.key === "Escape" && mt();
  });
  const Ft = T("div", "", "ms-grid");
  t.append(Ft);
  const Ue = T("div", "", "ms-footer");
  t.append(Ue);
  const de = T("span", e("Loading"));
  de.setAttribute("role", "status"), Ue.append(de);
  const Ht = T("span", "", "ms-selection");
  Ht.title = e("Select all matching results in Bulk change"), Ue.append(Ht);
  const Ti = T("span");
  Ue.append(Ti);
  const Ss = I("Previous", () => ye(async () => {
    i.offset = Math.max(0, i.offset - i.limit), await be();
  }), Ue), Ds = I("Next", () => ye(async () => {
    i.offset += i.limit, await be();
  }), Ue), Mi = T("div", "", "ms-filter-info");
  t.append(Mi);
  function At(g) {
    const C = new URLSearchParams();
    for (const [w, E] of Object.entries(g)) E !== null && C.set(w, typeof E == "object" ? JSON.stringify(E) : String(E));
    return C.toString();
  }
  function ge(g) {
    var E, M, D;
    const C = (E = g.details) == null ? void 0 : E.details, w = C && typeof C == "object" ? Object.entries(C).map(([x, z]) => {
      var A;
      return `${((A = d.get(x)) == null ? void 0 : A.label) ?? x}: ${String(z)}`;
    }).join(" · ") : "";
    if (de.textContent = `${((M = g.details) == null ? void 0 : M.code) ?? g.code ?? "Error"}: ${g.message}${w ? " " + w : ""}`, de.className = "ms-error", (D = g.details) != null && D.pk) {
      const x = g.details.field, z = x ? [x] : Object.keys(C && typeof C == "object" && Object.keys(C).length ? C : u.changes[g.details.pk] ?? {});
      for (const A of z) {
        const L = `${g.details.pk}:${A}`;
        $.set(L, String((C == null ? void 0 : C[A]) ?? g.message)), g.details.code.includes("conflict") && fe.add(L);
      }
      p == null || p.redraw(!0);
    }
  }
  function $e(g) {
    const C = T("dialog", "", "ms-dialog");
    C.append(T("h2", e(g)));
    const w = T("div");
    C.append(w);
    const E = T("div", "", "ms-dialog-actions");
    return C.append(E), I("Close", () => C.close(), E), C.addEventListener("close", () => C.remove()), t.append(C), C.showModal(), { dialog: C, body: w, actions: E };
  }
  async function ye(g) {
    try {
      if (u.dirty) {
        const C = await new Promise((w) => {
          const { dialog: E, body: M, actions: D } = $e("Unsaved edits");
          M.append(T("p", e("Unsaved changes"))), I("Save", () => {
            w("save"), E.close();
          }, D, "ms-primary"), I("Discard", () => {
            w("discard"), E.close();
          }, D), E.addEventListener("close", () => w("keep"), { once: !0 });
        });
        if (C === "keep") return;
        if (C === "save") {
          if (await Pt(), u.dirty) return;
        } else
          u.clear(), ve();
      }
      await g();
    } catch (C) {
      ge(C);
    }
  }
  async function be() {
    k = !0, X.disabled = !0, de.textContent = e("Loading");
    try {
      const g = await r("rows/?" + At(i));
      f = g.snapshot, i = g.state, m = structuredClone(i), u = new ji(g.rows, i.columns, c, g.today), S = g.count, F = g.has_next, v = null, $.clear(), fe.clear(), Y.clear(), history.replaceState({}, "", o.base + "?" + At(i)), p == null || p.destroy();
      const C = i.columns.map((w, E) => {
        const M = d.get(w), D = {
          title: `${yi(E)} · ${M.label}`,
          field: w,
          headerSort: !1,
          width: Bt[w] ?? 150,
          frozen: E < bt,
          formatter: (x) => zs(x, M),
          headerClick: (x) => x.altKey && ye(async () => {
            const z = i.sort.find((V) => V.field === w), A = (z == null ? void 0 : z.dir) === "asc" ? "desc" : (z == null ? void 0 : z.dir) === "desc" ? null : "asc", L = x.shiftKey ? i.sort.filter((V) => V.field !== w) : [];
            A && L.push({ field: w, dir: A }), i.sort = L, i.offset = 0, await be();
          })
        };
        return M.editable && (D.editor = M.choices.length ? "list" : "input", M.choices.length && (D.editorParams = { values: Object.fromEntries(M.choices) }), D.editable = () => !k, D.mutatorEdit = (x) => x), D;
      });
      for (const w of h) C.push({
        title: `ƒx · ${w.label}`,
        field: w.name,
        headerSort: !1,
        width: 160,
        formatter: (E) => {
          try {
            const M = E.getRow().getData().__modelsheet_pk, D = Object.fromEntries(Object.keys(E.getRow().getData().__modelsheet_original).map((x) => [x, u.value(M, x)]));
            return Ot(Ms(Ts(w.formula), {
              fields: D,
              today: u.today,
              column: (x) => u.rows.map((z) => u.value(z.pk, x))
            }));
          } catch (M) {
            return Ot(M instanceof N ? M.code : "#VALUE!");
          }
        }
      });
      p = new ao(Ft, {
        data: Li(),
        index: "__modelsheet_pk",
        columns: C,
        height: "min(64vh, 660px)",
        layout: "fitDataStretch",
        placeholder: e("No matching records"),
        selectableRange: 1,
        selectableRangeColumns: !0,
        selectableRangeRows: !0,
        selectableRangeClearCells: !1,
        editTriggerEvent: "dblclick",
        rowHeader: { field: "_rownum", formatter: "rownum", width: 55, frozen: !0, headerSort: !1, hozAlign: "center" },
        clipboard: !1
      }), p.on("cellClick", (w, E) => {
        v = E, b = E, mt();
      }), p.on("cellEditing", (w) => {
        w.setValue(u.raw(w.getRow().getData().__modelsheet_pk, w.getField()), !1);
      }), p.on("cellEdited", (w) => {
        v = w, Si(w.getRow().getData().__modelsheet_pk, w.getField(), w.getValue());
      }), p.on("rangeChanged", () => {
        const w = tt();
        Ht.textContent = `${new Set(w.map((E) => E.getRow().getData().__modelsheet_pk)).size} ${e("Selected rows on this page")}`;
      }), p.on("columnResized", (w) => {
        Bt[w.getField()] = w.getWidth(), Hi();
      }), await new Promise((w) => p.on("tableBuilt", () => w())), Ti.textContent = `${i.offset + (g.rows.length ? 1 : 0)}–${i.offset + g.rows.length}${S === null ? "" : " / " + S}`, Ss.disabled = i.offset === 0, Ds.disabled = !F, Mi.textContent = `${i.sort.map((w) => {
        var E;
        return `${((E = d.get(w.field)) == null ? void 0 : E.label) ?? "PK"} ${w.dir === "asc" ? "↑" : "↓"}`;
      }).join(" · ")}${Object.keys(i.filter).length ? " · " + JSON.stringify(i.filter) : ""}`, de.className = "", de.textContent = e("Ready");
    } finally {
      k = !1, X.disabled = !u.dirty;
    }
  }
  function Ot(g) {
    return T("span", g == null ? "" : String(g));
  }
  function Li() {
    return u.rows.map((g) => ({ __modelsheet_pk: g.pk, __modelsheet_original: g.values, ...g.values, ...u.changes[g.pk], ...Object.fromEntries(h.map((C) => [C.name, J])) }));
  }
  function zs(g, C) {
    var D;
    const w = g.getRow().getData().__modelsheet_pk, E = C.name, M = Ot("");
    g.getElement().classList.toggle("ms-readonly", !C.editable), g.getElement().classList.toggle("ms-dirty", Object.hasOwn(u.changes[w] ?? {}, E)), g.getElement().classList.toggle("ms-cell-error", $.has(`${w}:${E}`)), g.getElement().classList.toggle("ms-cell-conflict", fe.has(`${w}:${E}`)), g.getElement().classList.toggle("ms-cell-saving", k && Object.hasOwn(u.changes[w] ?? {}, E)), g.getElement().classList.toggle("ms-cell-saved", Y.has(`${w}:${E}`));
    try {
      const x = u.value(w, E);
      M.textContent = ((D = C.choices.find(([z]) => z === x)) == null ? void 0 : D[1]) ?? (x === null ? "∅" : String(x)), C.type === "DateTimeField" && x && (M.textContent = new Intl.DateTimeFormat(o.language, { dateStyle: "short", timeStyle: "medium", timeZone: a.timezone ?? "UTC" }).format(new Date(String(x))));
    } catch (x) {
      M.textContent = x instanceof N ? x.code : "#VALUE!", M.className = "ms-error";
    }
    return $.has(`${w}:${E}`) && (M.title = $.get(`${w}:${E}`)), M;
  }
  function mt() {
    if (!v) return;
    const g = v.getRow().getData().__modelsheet_pk, C = v.getField();
    ki.textContent = `${yi(i.columns.indexOf(C))}${u.rows.findIndex((w) => w.pk === g) + 1}`, Ge.value = String(u.raw(g, C) ?? ""), Ge.disabled = !c.has(C);
  }
  function Si(g, C, w) {
    u.apply([{ pk: g, field: C, value: w }]), $.delete(`${g}:${C}`), fe.delete(`${g}:${C}`), Y.delete(`${g}:${C}`), _ = null, ve();
  }
  function ve() {
    if (k) return;
    const g = p;
    J++, g && Promise.all(Li().map((C) => g.getRow(C.__modelsheet_pk).update(C))).catch(ge), X.disabled = !u.dirty, de.className = "", de.textContent = u.dirty ? `${e("Changed rows")}: ${Object.keys(u.changes).length}` : e("Ready"), mt();
  }
  async function Pt() {
    if (!u.dirty || k) return;
    k = !0, X.disabled = !0, de.textContent = e("Saving");
    const g = { snapshot: f, view_state: m, changes: u.payload() };
    p == null || p.redraw(!0);
    const C = JSON.stringify(g);
    (C !== j || !_) && (j = C, _ = crypto.randomUUID());
    try {
      await r("save/", { ...g, idempotency_key: _ }), u.clear(), _ = null, await be(), de.textContent = "✓ " + e("Saved");
      for (const w of g.changes) for (const E of Object.keys(w.values)) Y.add(`${w.pk}:${E}`);
      p == null || p.redraw(!0);
    } catch (w) {
      throw ge(w), w;
    } finally {
      k = !1, X.disabled = !u.dirty;
    }
  }
  function tt() {
    var g, C;
    return ((C = (g = p == null ? void 0 : p.getRanges()) == null ? void 0 : g.flatMap((w) => w.getCells().flat())) == null ? void 0 : C.filter((w) => d.has(w.getField()))) ?? [];
  }
  function _t() {
    const g = tt();
    if (!g.length && v && g.push(v), !g.length) throw new Error(e("No rows selected"));
    const C = g.map((w) => [u.rows.findIndex((E) => E.pk === w.getRow().getData().__modelsheet_pk), i.columns.indexOf(w.getField())]);
    return { top: Math.min(...C.map((w) => w[0])), bottom: Math.max(...C.map((w) => w[0])), left: Math.min(...C.map((w) => w[1])), right: Math.max(...C.map((w) => w[1])) };
  }
  function Di() {
    const g = _t(), C = [];
    for (let E = g.top + 1; E <= g.bottom; E++) for (let M = g.left; M <= g.right; M++) {
      const D = u.transferValue(u.rows[g.top].pk, i.columns[M]);
      C.push({ pk: u.rows[E].pk, field: i.columns[M], value: typeof D == "string" ? Wi(D, E - g.top, 0) : D });
    }
    const w = u.apply(C);
    ve(), w && (de.textContent = `${e("Readonly cells skipped")}: ${w}`);
  }
  Ft.addEventListener("keydown", (g) => {
    if (g.target.matches("input, textarea, select") || !v || k) return;
    const C = u.rows.findIndex((M) => M.pk === v.getRow().getData().__modelsheet_pk), w = i.columns.indexOf(v.getField());
    if (w < 0) return;
    const E = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1], Enter: [g.shiftKey ? -1 : 1, 0], Tab: [0, g.shiftKey ? -1 : 1] };
    if (g.key in E && !g.ctrlKey && !g.metaKey && !g.altKey) {
      g.preventDefault(), g.stopImmediatePropagation();
      const [M, D] = E[g.key];
      let x = C + M, z = w + D;
      g.key === "Tab" && (z >= i.columns.length && (x++, z = 0), z < 0 && (x--, z = i.columns.length - 1)), x = Math.max(0, Math.min(u.rows.length - 1, x)), z = Math.max(0, Math.min(i.columns.length - 1, z));
      const A = p.getRow(u.rows[x].pk).getCell(i.columns[z]), L = g.shiftKey && g.key.startsWith("Arrow");
      L || (b = A);
      const V = p.getRanges()[0];
      V ? V.setBounds(L ? b ?? v : A, A) : p.addRange(L ? b ?? v : A, A), v = A, mt(), A.getRow().scrollTo("nearest", !1).then(() => {
        A.getElement().tabIndex = 0, A.getElement().focus({ preventScroll: !0 });
      }).catch(ge);
    }
  }, !0), t.addEventListener("keydown", (g) => {
    const C = g.target;
    if (!(C.matches("input, textarea, select") || C.closest("dialog"))) {
      if (g.ctrlKey || g.metaKey) {
        if (["z", "y", "d", "s"].includes(g.key.toLowerCase()) && g.stopImmediatePropagation(), g.key.toLowerCase() === "z" && (g.preventDefault(), g.shiftKey ? u.redo() : u.undo(), ve()), g.key.toLowerCase() === "y" && (g.preventDefault(), u.redo(), ve()), g.key.toLowerCase() === "d") {
          g.preventDefault();
          try {
            Di();
          } catch (w) {
            ge(w);
          }
        }
        g.key.toLowerCase() === "s" && (g.preventDefault(), Pt().catch(ge));
      }
      (g.key === "Delete" || g.key === "Backspace") && (g.preventDefault(), u.apply(tt().map((w) => ({ pk: w.getRow().getData().__modelsheet_pk, field: w.getField(), value: null }))), ve());
    }
  }, !0), t.addEventListener("copy", (g) => zi(g, !1)), t.addEventListener("cut", (g) => zi(g, !0));
  function zi(g, C) {
    var w;
    if (!(g.target.matches("input,textarea") || g.target.closest("dialog")))
      try {
        const E = _t(), M = [];
        for (let x = E.top; x <= E.bottom; x++) {
          const z = [];
          for (let A = E.left; A <= E.right; A++)
            z.push(u.transferValue(u.rows[x].pk, i.columns[A]));
          M.push(z);
        }
        const D = oa(M);
        (w = g.clipboardData) == null || w.setData("text/plain", D), g.preventDefault(), U = { text: D, row: E.top, col: E.left, snapshot: f }, C && (u.apply(tt().map((x) => ({ pk: x.getRow().getData().__modelsheet_pk, field: x.getField(), value: null }))), ve());
      } catch (E) {
        ge(E);
      }
  }
  t.addEventListener("paste", (g) => {
    var C;
    if (!(g.target.matches("input,textarea") || g.target.closest("dialog"))) {
      g.preventDefault();
      try {
        const w = ((C = g.clipboardData) == null ? void 0 : C.getData("text/plain")) ?? "", E = ra(w), M = _t(), D = [];
        if (E.length > a.max_save_rows || w.length > 1e6) throw new Error("Paste exceeds configured limits");
        for (let z = 0; z < E.length; z++) for (let A = 0; A < E[z].length; A++) {
          if (!u.rows[M.top + z] || !i.columns[M.left + A]) throw new N("#REF!", "Paste extends beyond the loaded page");
          let L = E[z][A] === "" ? null : E[z][A];
          if (L != null && L.startsWith("=") && c.has(i.columns[M.left + A])) {
            const V = Fs(L);
            if (U && U.text === w && V) {
              if (U.snapshot !== f) throw new N("#REF!", "Copied positional formulas belong to an older view");
              L = Wi(L, M.top - U.row, M.left - U.col);
            }
          }
          D.push({ pk: u.rows[M.top + z].pk, field: i.columns[M.left + A], value: L });
        }
        const x = u.apply(D);
        ve(), x && (de.textContent = `${e("Readonly cells skipped")}: ${x}`);
      } catch (w) {
        ge(w);
      }
    }
  });
  function Fs(g) {
    return /\$?[A-Za-z]+\$?[1-9][0-9]*/.test(g.replace(/"(?:[^"]|"")*"|\[[^\]]*\]/g, ""));
  }
  window.addEventListener("beforeunload", (g) => {
    u.dirty && (g.preventDefault(), g.returnValue = "");
  });
  function Ne(g, C) {
    const w = T("select");
    for (const [E, M] of g) {
      const D = T("option", M);
      D.value = E, w.append(D);
    }
    return w.value = C, w;
  }
  function gt(g = {}) {
    const C = T("fieldset", "", "ms-filter-group"), w = Ne([["and", "AND"], ["or", "OR"]], g.or ? "or" : "and");
    C.append(w);
    const E = [];
    function M(x) {
      E.push(x), C.append(x.node), I("Remove", () => {
        E.splice(E.indexOf(x), 1), x.node.remove();
      }, x.node);
    }
    const D = (x = {}) => {
      var ae;
      const z = T("div", "", "ms-condition"), A = Ne(l.map((ue) => [ue.name, ue.label]), x.field ?? ((ae = l[0]) == null ? void 0 : ae.name) ?? ""), L = Ne(["eq", "ne", "lt", "lte", "gt", "gte", "in", "not_in", "isnull", "contains"].map((ue) => [ue, ue]), x.op ?? "eq"), V = T("input");
      return V.placeholder = "Value / comma-separated list", V.value = Array.isArray(x.value) ? x.value.join(",") : String(x.value ?? ""), z.append(A, L, V), { node: z, read: () => ({
        field: A.value,
        op: L.value,
        value: L.value === "isnull" ? ["true", "1"].includes(V.value.toLowerCase()) : ["in", "not_in"].includes(L.value) ? V.value.split(",").map((ue) => ue.trim()) : V.value
      }) };
    };
    I("Add condition", () => M(D()), C), I("Add group", () => M(gt()), C);
    for (const x of g.and ?? g.or ?? (Object.keys(g).length ? [g] : [])) M(x.and || x.or ? gt(x) : D(x));
    return { node: C, read: () => E.length ? { [w.value]: E.map((x) => x.read()) } : {} };
  }
  function Hs() {
    const { dialog: g, body: C, actions: w } = $e("Filters"), E = gt(i.filter);
    C.append(E.node), I("Apply", () => ye(async () => {
      i.filter = E.read(), i.offset = 0, await be(), g.close();
    }), w, "ms-primary");
  }
  function As() {
    const { dialog: g, body: C, actions: w } = $e("Sort"), E = [];
    function M(D = { field: ((x) => (x = l[0]) == null ? void 0 : x.name)() ?? "", dir: "asc" }) {
      if (E.length >= 10) return;
      const z = T("div", "", "ms-condition"), A = Ne([["pk", "PK"], ...l.map((ae) => [ae.name, ae.label])], D.field), L = Ne([["asc", e("Ascending")], ["desc", e("Descending")]], D.dir);
      z.append(A, L), C.append(z);
      const V = { node: z, field: A, direction: L };
      E.push(V), I("Remove", () => {
        E.splice(E.indexOf(V), 1), z.remove();
      }, z);
    }
    i.sort.forEach(M), E.length || M(), I("Add sort", () => M(), C), I("Apply", () => ye(async () => {
      i.sort = E.map((D) => ({ field: D.field.value, dir: D.direction.value })), i.offset = 0, await be(), g.close();
    }), w, "ms-primary");
  }
  const Fi = "modelsheet:" + o.base;
  let Nt = {};
  try {
    Nt = JSON.parse(localStorage.getItem(Fi) ?? "{}");
  } catch {
  }
  const Bt = Nt.widths ?? {};
  let bt = Nt.frozen ?? 0;
  function Hi() {
    try {
      localStorage.setItem(Fi, JSON.stringify({ widths: Bt, frozen: bt }));
    } catch {
    }
  }
  function Os() {
    const { dialog: g, body: C, actions: w } = $e("Columns"), E = [...i.columns, ...l.map((x) => x.name).filter((x) => !i.columns.includes(x))], M = /* @__PURE__ */ new Map();
    for (const x of E) {
      const z = T("div", "", "ms-condition"), A = T("label", d.get(x).label), L = T("input");
      L.type = "checkbox", L.checked = i.columns.includes(x), M.set(x, L), A.prepend(L), z.append(A), C.append(z), I("↑", () => {
        var ae;
        const V = E.indexOf(x);
        V > 0 && ([E[V - 1], E[V]] = [x, E[V - 1]], (ae = z.previousElementSibling) == null || ae.before(z));
      }, z);
    }
    const D = T("input");
    D.type = "number", D.min = "0", D.max = String(l.length), D.value = String(bt), C.append(T("label", e("Frozen columns")), D), I("Apply", () => ye(async () => {
      i.columns = E.filter((x) => M.get(x).checked), bt = Math.max(0, Math.min(i.columns.length, Number(D.value))), Hi(), await be(), g.close();
    }), w, "ms-primary");
  }
  async function Ps() {
    const { dialog: g, body: C, actions: w } = $e("Bulk change"), E = Ne([["all", e("All filtered rows")], ["selected", e("Selected rows on this page")]], "all");
    C.append(E);
    const M = gt(i.filter);
    C.append(M.node);
    const D = T("div");
    C.append(D);
    const x = [];
    function z() {
      var Ai;
      const re = T("div", "", "ms-condition"), se = Ne(l.filter((qe) => qe.editable).map((qe) => [qe.name, qe.label]), ((Ai = l.find((qe) => qe.editable)) == null ? void 0 : Ai.name) ?? ""), st = T("input");
      st.placeholder = e("Value or formula"), re.append(se, st), D.append(re);
      const Me = { field: se, input: st, node: re };
      x.push(Me), I("Remove", () => {
        x.splice(x.indexOf(Me), 1), re.remove();
      }, re);
    }
    z(), I("Add assignment", z, C);
    const A = T("div", "", "ms-report");
    C.append(A);
    let L = null, V = null;
    const ae = I("Confirm", async () => {
      var re;
      if (!(!L || !window.confirm(`${e("Confirm")}: ${L.total} records?`)))
        try {
          L = await r("bulk/run/", { operation: L.id }), Re();
        } catch (se) {
          A.textContent = `${(re = se.details) == null ? void 0 : re.code}: ${se.message}`;
        }
    }, w, "ms-primary");
    ae.disabled = !0;
    const ue = I("Preview", async () => {
      var re;
      try {
        const se = {};
        for (const Me of x) {
          if (Object.hasOwn(se, Me.field.value)) throw new Error("Duplicate assignment");
          se[Me.field.value] = Me.input.value;
        }
        const st = E.value === "selected" ? [...new Set(tt().map((Me) => Me.getRow().getData().__modelsheet_pk))] : null;
        L = await r("bulk/preview/", {
          state: { ...i, filter: M.read() },
          assignments: se,
          selection: st,
          snapshot: f,
          idempotency_key: crypto.randomUUID()
        }), Re();
      } catch (se) {
        A.textContent = `${((re = se.details) == null ? void 0 : re.code) ?? "Error"}: ${se.message}`;
      }
    }, w), Vt = I("Cancel", async () => {
      L && (L = await r(`operations/${L.id}/cancel/`, {}), Re());
    }, w), it = I("Resume", async () => {
      L && (L = await r(`operations/${L.id}/resume/`, {}), Re());
    }, w);
    function Re() {
      A.replaceChildren(), L && It(A, L), ae.disabled = !L || L.status !== "preview" || L.errors > 0, ue.disabled = ["preparing", "queued", "running"].includes(L == null ? void 0 : L.status), Vt.disabled = !L || ["done", "partial", "failed", "cancelled"].includes(L.status);
      const re = L && ["running", "preparing", "queued"].includes(L.status) && L.lease_until && new Date(L.lease_until).getTime() < Date.now();
      it.disabled = !L || !["cancelled", "dispatch_failed", "failed"].includes(L.status) && !re, V && clearTimeout(V), ["preparing", "queued", "running"].includes(L == null ? void 0 : L.status) && (V = setTimeout(async () => {
        if (g.open)
          try {
            L = await r(`operations/${L.id}/`), Re();
          } catch (se) {
            A.textContent = se.message;
          }
      }, 1500));
    }
    C.addEventListener("input", () => {
      L = null, ae.disabled = !0, A.textContent = "";
    }), g.addEventListener("close", () => {
      V && clearTimeout(V), L != null && L.changed && !u.dirty && be().catch(ge);
    }), Re();
  }
  async function _s() {
    const { body: g } = $e("History");
    async function C(w = 0) {
      const E = await r("history/?offset=" + w);
      for (const M of E.operations) {
        const D = T("div", "", "ms-history-entry");
        g.append(D), D.append(T("p", `${new Date(M.created_at).toLocaleString(o.language)} · ${e(M.status)} · ${M.changed}/${M.total}`)), I("Details", async () => {
          const x = await r(`operations/${M.id}/`), z = T("div", "", "ms-report");
          D.append(z), It(z, x);
        }, D);
      }
      if (E.has_next) {
        const M = I("Next", async () => {
          M.remove(), await C(w + 20);
        }, g);
      }
    }
    await C();
  }
  function It(g, C) {
    g.append(T("p", `${e(C.status)} · ${e("Matched")}: ${C.total} · ${e("Changed rows")}: ${C.changed} · ${e("Errors")}: ${C.errors}`));
    const w = T("table"), E = T("thead"), M = T("tr");
    for (const z of ["PK", "Status", "Before", "After", "Error"]) M.append(T("th", e(z)));
    E.append(M), w.append(E);
    const D = T("tbody");
    w.append(D);
    function x(z) {
      var A, L;
      for (const V of z) {
        const ae = T("tr"), ue = (it) => Object.entries(it).map(([Re, re]) => {
          var se;
          return `${((se = d.get(Re)) == null ? void 0 : se.label) ?? Re}: ${re === null ? "∅" : String(re)}`;
        }).join(`
`), Vt = (A = V.error) != null && A.details ? ue(V.error.details) : ((L = V.error) == null ? void 0 : L.message) ?? "";
        for (const it of [V.pk, e(V.status), ue(V.before), ue(V.after), Vt]) ae.append(T("td", it));
        D.append(ae);
      }
    }
    if (x(C.items), g.append(w), C.has_next) {
      const z = I("Next", async () => {
        const A = await r(`operations/${C.id}/?offset=${C.next_offset}`);
        z.remove();
        const L = T("div");
        g.append(L), It(L, A);
      }, g);
    }
  }
  await be();
}
