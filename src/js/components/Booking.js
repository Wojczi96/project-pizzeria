import {classNames, select, settings, templates} from '../settings.js';
import utils from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';

class Booking{
    constructor(element){
        const thisBooking = this;
        thisBooking.render(element);
        thisBooking.initWidgets();
        thisBooking.getData();
        thisBooking.selectedTable = {};
    }

    getData(){
        const thisBooking = this;
        const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
        const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);

        const params = {
            bookings: [
                startDateParam,
                endDateParam,
            ],
            eventsCurrent: [
                settings.db.notRepeatParam,
                startDateParam,
                endDateParam,

            ],
            eventsRepeat: [
                settings.db.repeatParam,
                endDateParam,
            ],
        };

        // console.log('getData params', params);
        const urls = {
            bookings:      settings.db.url + '/' + settings.db.bookings
                                           + '?' + params.bookings.join('&'),
            eventsCurrent: settings.db.url + '/' + settings.db.events
                                           + '?' + params.eventsCurrent.join('&'),
            eventsRepeat:  settings.db.url + '/' + settings.db.events
                                           + '?' + params.eventsRepeat.join('&'),
        };


        Promise.all([
            fetch(urls.bookings),
            fetch(urls.eventsCurrent),
            fetch(urls.eventsRepeat),
        ])
            .then(function(allResponses){
                const bookingsResponse = allResponses[0];
                const eventsCurrentResponse = allResponses[1];
                const eventsRepeatResponse = allResponses[2];
                return Promise.all([
                    bookingsResponse.json(),
                    eventsCurrentResponse.json(),
                    eventsRepeatResponse.json(),
                ]);
            })
            .then(function([bookings, eventsCurrent, eventsRepeat]){
                // console.log(bookings);
                // console.log(eventsCurrent);
                // console.log(eventsRepeat);
                thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
            });

    }

    parseData(bookings, eventsCurrent, eventsRepeat){
        const thisBooking = this;
        thisBooking.booked = {};

        for(let item of bookings){
            thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
        }

        for(let item of eventsCurrent){
            thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
        }

        const minDate = thisBooking.datePicker.minDate;
        const maxDate = thisBooking.datePicker.maxDate;

        for(let item of eventsRepeat){
            if(item.repeat == 'daily'){
                for(let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)){
            thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
                }
            }
        }

        // console.log('thisBooking.booked:', thisBooking.booked);

        thisBooking.updateDOM();
    }

    makeBooked(date, hour, duration, table){
        const thisBooking = this;

        if(typeof thisBooking.booked[date] == 'undefined'){
            thisBooking.booked[date] = {};
        }

        const startHour = utils.hourToNumber(hour);


        for(let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5){
            // console.log('loop:', hourBlock);

            if(typeof thisBooking.booked[date][hourBlock] == 'undefined'){
            thisBooking.booked[date][hourBlock] = [];
            }

            thisBooking.booked[date][hourBlock].push(table);

        }
    }

    updateDOM() {
        const thisBooking = this;
        thisBooking.date = thisBooking.datePicker.value;
        thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);


        let allAvailable = false;

        if (
          typeof thisBooking.booked[thisBooking.date] == 'undefined'
          ||
          typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
        ) {
          allAvailable = true;
        }

        for (let table of thisBooking.dom.tables) {
          let tableId = table.getAttribute(settings.booking.tableIdAttribute);
          if (!isNaN(tableId)) {
            tableId = parseInt(tableId);
          }

          if (
            !allAvailable
            &&
            thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
          ) {
            table.classList.add(classNames.booking.tableBooked);
          } else {
            table.classList.remove(classNames.booking.tableBooked);
          }
          if (table.classList.contains(classNames.booking.tableSelected)) {
            table.classList.remove(classNames.booking.tableSelected);
          }
        }
    }

    bookTable(event){
        const thisBooking = this;
        const clickedElement = event.target;
        console.log(clickedElement);
        if(clickedElement.classList.contains(classNames.booking.table)){
            const tableNum = clickedElement.getAttribute('data-table');
            if(!clickedElement.classList.contains(classNames.booking.tableBooked)
            && !clickedElement.classList.contains(classNames.booking.tableSelected)){
                clickedElement.classList.add(classNames.booking.tableSelected);
                thisBooking.selectedTable = tableNum;
            } else if (!clickedElement.classList.contains(classNames.booking.tableBooked)
                && clickedElement.classList.contains(classNames.booking.tableSelected)){
                clickedElement.classList.remove(classNames.booking.tableSelected);

            } else if (clickedElement.classList.contains(classNames.booking.tableBooked)){
                alert('This table has already been booked. Please choose different table.');
            }
        }

    }

    sendBooking(){
        const thisBooking = this;
        const url = settings.db.url + '/' + settings.db.bookings;
        const payload = {
            date: thisBooking.datePicker.value,
            hour: thisBooking.hourPicker.value,
            table: parseInt(thisBooking.selectedTable),
            duration: parseInt(thisBooking.hoursAmount.value),
            ppl: parseInt(thisBooking.peopleAmount.value),
            starters: [],
            phone: thisBooking.dom.phone.value,
            address: thisBooking.dom.address.value,
        };

        for(let starter of thisBooking.starters){
            console.log(starter);
            payload.starters.push(starter);
        }
        const options = {
            method: 'POST',
            headers: {'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        };
        fetch(url, options)
        .then(
            thisBooking.makeBooked(payload.date, payload.hour, payload.duration, payload.table)
        );

        console.log('Starters:', payload);
    }

    render(element){
        const thisBooking = this;
        const genHTML = templates.bookingWidget();
        thisBooking.dom = {};
        thisBooking.starters = [];
        thisBooking.dom.wrapper = element;
        thisBooking.dom.wrapper.innerHTML = genHTML;
        thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
        thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);
        thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
        thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);
        thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);
        thisBooking.dom.bookTable = thisBooking.dom.wrapper.querySelector(select.booking.tablesAll);
        thisBooking.dom.orderButton = thisBooking.dom.wrapper.querySelector(select.booking.orderButton);
        thisBooking.dom.phone = thisBooking.dom.wrapper.querySelector(select.booking.phone);
        thisBooking.dom.address = thisBooking.dom.wrapper.querySelector(select.booking.address);
        thisBooking.dom.starters = thisBooking.dom.wrapper.querySelector(select.booking.starters);
    }
    initWidgets(){
        const thisBooking = this;
        thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
        thisBooking.dom.peopleAmount.addEventListener('click', function(){
        });

        thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
        thisBooking.dom.hoursAmount.addEventListener('click', function(){
        });

        thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
        thisBooking.dom.datePicker.addEventListener('click', function(){

        });

        thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);
        thisBooking.dom.hourPicker.addEventListener('click', function(){

        });

        thisBooking.dom.wrapper.addEventListener('updated', function(){
            thisBooking.updateDOM();
        });
        thisBooking.dom.bookTable.addEventListener('click', function(event){
            event.preventDefault();
            thisBooking.changeEvent = event;
            thisBooking.bookTable(event);
        });
        thisBooking.dom.orderButton.addEventListener('click', function(event){
            event.preventDefault();
            thisBooking.sendBooking();
        })
        thisBooking.dom.starters.addEventListener('click', function(event){
            const clickedElement = event.target;
            if(clickedElement.tagName == 'INPUT'
            && clickedElement.type == 'checkbox'
            && clickedElement.name == 'starter'){
                if(clickedElement.checked){
                    thisBooking.starters.push(clickedElement.value);
                }
            }
        })

    }

}

export default Booking;