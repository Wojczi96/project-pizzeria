import { select, settings } from "../settings.js";


class AmountWidget{
    constructor(element){
      const thisWidget = this;
      // console.log('AmountWidget:', thisWidget);
      // console.log('constructor arguments:', element);
      thisWidget.getElements(element);
      // thisWidget.setValue(thisWidget.input.value);
      if (thisWidget.input.value === '' || thisWidget.input.value === undefined ) {
        thisWidget.setValue(settings.amountWidget.defaultValue)
      } else {
        thisWidget.setValue(thisWidget.input.value);
      }
        thisWidget.initActions();
    }

    getElements(element){
      const thisWidget = this;

      thisWidget.element = element;
      thisWidget.input = thisWidget.element.querySelector(select.widgets.amount.input);
      thisWidget.linkDecrease = thisWidget.element.querySelector(select.widgets.amount.linkDecrease);
      thisWidget.linkIncrease = thisWidget.element.querySelector(select.widgets.amount.linkIncrease);
    }

    setValue(value){
      const thisWidget = this;
      const newValue = parseInt(value);

      if(thisWidget.value !== newValue && !isNaN(newValue)) {
        thisWidget.value = newValue;
      }
      if(thisWidget.value < settings.amountWidget.defaultMin){
        thisWidget.value = settings.amountWidget.defaultMin;
      }
      if(thisWidget.value > settings.amountWidget.defaultMax){
        thisWidget.value = settings.amountWidget.defaultMax;
      }
      thisWidget.input.value = thisWidget.value;
      thisWidget.announce();
    }

    initActions(){
      const thisWidget = this;
      thisWidget.input.addEventListener('change', () =>{
        thisWidget.setValue(thisWidget.input.value);
      });
      thisWidget.linkDecrease.addEventListener('click', (event) =>{
        event.preventDefault();
        thisWidget.setValue(thisWidget.value -1);
      });
      thisWidget.linkIncrease.addEventListener('click', (event) =>{
        event.preventDefault();
        thisWidget.setValue(thisWidget.value +1);
      });
    }
    announce(){
      const thisWidget = this;
      const event = new Event('updated', {
        bubbles: true
      });
      thisWidget.element.dispatchEvent(event);
    }
  }

  export default AmountWidget;