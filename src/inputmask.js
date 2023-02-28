import Inputmask from "inputmask";

function init(Survey) {
  var widget = {
    name: "maskedit",
    numericGroupSeparator: ",",
    numericRadixPoint: undefined,
    numericAutoGroup: true,
    numericDigits: 2,
    numericDigitsOptional: false,
    numericPlaceholder: "0",
    autoUnmask: true,
    clearIncomplete: true,
    showMaskOnHover: true,
    widgetIsLoaded: function () {
      return typeof Inputmask != "undefined";
    },
    isFit: function (question) {
      if (question.getType() == "multipletext") return true;
      return (
        question.getType() == "text" &&
        (question.inputMask != "none" || question.inputFormat)
      );
    },
    isDefaultRender: true,
    activatedByChanged: function (activatedBy) {
      if (Survey.JsonObject.metaData.findProperty("text", "inputMask")) return;
      var properties = [
        {
          name: "autoUnmask:boolean",
          category: "general",
          default: true,
        },
        {
          name: "clearIncomplete:boolean",
          category: "general",
          default: true,
        },
        {
          name: "showMaskOnHover:boolean",
          category: "general",
          default: true,
        },
        { name: "inputFormat", category: "general" },
        {
          name: "inputMask",
          category: "general",
          default: "none",
          choices: [
            "none",
            "datetime",
            "currency",
            "decimal",
            "email",
            "phone",
            "ip",
          ],
        },
        {
          name: "numericDigits",
          category: "general",
          visible: false,
        },
        {
          name: "options",
          category: "general",
          visible: false,
        },
        {
          name: "prefix",
          category: "general",
          visible: false,
        },
        {
          name: "suffix",
          category: "general",
          visible: false,
        },
      ];
      Survey.JsonObject.metaData.addProperties("text", properties);
      Survey.JsonObject.metaData.addProperties(
        "matrixdropdowncolumn",
        properties
      );
      Survey.JsonObject.metaData.addProperties("multipletextitem", properties);
    },
    applyInputMask: function (surveyElement, el) {
      var rootWidget = this;
      var mask =
        surveyElement.inputMask !== "none"
          ? surveyElement.inputMask
          : surveyElement.inputFormat;
      var options = {};
      if (typeof surveyElement.options === "object") {
        for (var option in surveyElement.options) {
          options[option] = surveyElement.options[option];
        }
      }
      options.autoUnmask = typeof surveyElement.autoUnmask !== "undefined"
        ? surveyElement.autoUnmask
        : rootWidget.autoUnmask;
      options.clearIncomplete = typeof surveyElement.clearIncomplete !== "undefined"
        ? surveyElement.clearIncomplete
        : rootWidget.clearIncomplete;
      options.showMaskOnHover = typeof surveyElement.showMaskOnHover !== "undefined"
        ? surveyElement.showMaskOnHover
        : rootWidget.showMaskOnHover;
      if (surveyElement.inputMask !== "none") {
        options.inputFormat = surveyElement.inputFormat;
      }
      if (
        surveyElement.inputMask === "currency" ||
        surveyElement.inputMask === "decimal"
      ) {
        options.groupSeparator = rootWidget.numericGroupSeparator;
        options.radixPoint = rootWidget.numericRadixPoint;
        options.autoGroup = rootWidget.numericAutoGroup;
        options.placeholder = rootWidget.numericPlaceholder;        
      }
      if (surveyElement.inputMask === "currency") {
        options.digits = surveyElement.numericDigits || rootWidget.numericDigits;
        options.digitsOptional = rootWidget.numericDigitsOptional;
        options.prefix = surveyElement.prefix || "";
        options.suffix = surveyElement.suffix || "";
        options.placeholder = rootWidget.numericPlaceholder;        
      }
      // if (surveyElement.inputMask == "datetime") {
      //   mask = surveyElement.inputFormat;
      // }
      if (surveyElement.inputMask === "phone" && !!surveyElement.inputFormat) {
        mask = surveyElement.inputFormat;
      }
      Inputmask(mask, options).mask(el);

      el.onblur = function () {
        if (!el.inputmask) return;
        if (surveyElement.value === el.inputmask.getemptymask()) {
          surveyElement.value = "";
        }
      };

      var customWidgetData =
        surveyElement.getType() === "multipletextitem"
          ? surveyElement.editorValue.customWidgetData
          : surveyElement.customWidgetData;
      el.oninput = function () {
        customWidgetData.isNeedRender = true;
      };

      var pushValueHandler = function () {        
        if (!el.inputmask) return;
        if (el.inputmask.isComplete()) {
          if(options.autoUnmask) {
			if ("currency" === surveyElement.inputMask) {
              // Use a dot instead of the configured radix point, since we want a floating point
              // number for the internal representation of the currency value.
              const floatValue = el.inputmask.unmaskedvalue().replace(options.radixPoint, '.');
              surveyElement.value = parseFloat(floatValue);
            } else {
              surveyElement.value = el.inputmask.unmaskedvalue();
            }
          } else {
            surveyElement.value = el.value;
          }
        } else {
          surveyElement.value = null;
        }
      };
      el.onfocusout = el.onchange = pushValueHandler;

      var updateHandler = function () {
        el.value =
          surveyElement.value === undefined || surveyElement.value === null
            ? ""
            : surveyElement.value;
      };
      surveyElement.valueChangedCallback = updateHandler;
      updateHandler();
    },
    afterRender: function (question, el) {      
      if (question.getType() != "multipletext") {
        var input = el.querySelector("input") || el;
        this.applyInputMask(question, input);
      } else {
        for (var i = 0; i < question.items.length; i++) {
          var item = question.items[i];
          if (item.inputMask != "none" || item.inputFormat) {
            var input = el.querySelector("#" + item.editor.inputId);
            if (input) {
              this.applyInputMask(item, input);
            }
          }
        }
      }
    },
    willUnmount: function (question, el) {
      var input = el.querySelector("input") || el;
      if (!!input && !!input.inputmask) {
        input.inputmask.remove();
      }
    },
  };

  Survey.CustomWidgetCollection.Instance.addCustomWidget(widget);
}

if (typeof Survey !== "undefined") {
  init(Survey);
}

export default init;
