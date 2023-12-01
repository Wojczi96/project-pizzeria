import { classNames, select, templates } from "../settings.js";

class Home {
    constructor(element){
        const thisHome = this;
        thisHome.render(element);
        thisHome.initAction();
    }
    render(element){
        const thisHome = this;

        thisHome.dom = {};
        thisHome.dom.wrapper = element;
        const generateHTML = templates.homeWidget();
        thisHome.dom.wrapper.innerHTML = generateHTML;
        thisHome.dom.foodOrder = thisHome.dom.wrapper.querySelector(select.home.foodOrder);
        thisHome.dom.tableOrder = thisHome.dom.wrapper.querySelector(select.home.tableOrder);
        thisHome.pages = document.querySelector(select.containerOf.pages).children;
        thisHome.navLinks = document.querySelectorAll(select.nav.links);
    }
    initAction(){
        const thisHome = this;
        thisHome.dom.foodOrder.addEventListener('click', function(event){
            event.preventDefault();
            thisHome.pages[0].classList.remove(classNames.pages.active);
            thisHome.navLinks[0].classList.remove(classNames.nav.active);
            thisHome.pages[1].classList.add(classNames.pages.active);
            thisHome.navLinks[1].classList.add(classNames.nav.active);
        })
        thisHome.dom.tableOrder.addEventListener('click', function(event){
            event.preventDefault();
            thisHome.pages[0].classList.remove(classNames.pages.active);
            thisHome.navLinks[0].classList.remove(classNames.nav.active);
            thisHome.pages[2].classList.add(classNames.pages.active);
            thisHome.navLinks[2].classList.add(classNames.nav.active);
        })


    }
}

export default Home;