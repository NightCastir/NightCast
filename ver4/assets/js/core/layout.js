/*
=================================================

NightCast Ver4
Layout Controller

Responsible for:
- Mobile Sidebar
- Overlay
- Menu Toggle
- Global UI

=================================================
*/


"use strict";





class LayoutManager {



    constructor(){


        this.sidebar =

        document.getElementById(

            "sidebar"

        );





        this.overlay =

        document.getElementById(

            "overlay"

        );





        this.menuToggle =

        document.getElementById(

            "menuToggle"

        );





        this.init();


    }









    init(){



        this.bindEvents();



    }









    bindEvents(){



        this.menuToggle?.addEventListener(

            "click",

            ()=>this.toggleMenu()

        );







        this.overlay?.addEventListener(

            "click",

            ()=>this.closeMenu()

        );







        document.addEventListener(

            "keydown",

            (e)=>{


                if(

                    e.key==="Escape"

                ){

                    this.closeMenu();

                }


            }

        );



    }









    toggleMenu(){



        this.sidebar.classList.toggle(

            "open"

        );





        this.overlay.classList.toggle(

            "show"

        );



        document.body.classList.toggle(

            "menu-open"

        );



    }









    closeMenu(){



        this.sidebar.classList.remove(

            "open"

        );





        this.overlay.classList.remove(

            "show"

        );





        document.body.classList.remove(

            "menu-open"

        );



    }



}









document.addEventListener(

"DOMContentLoaded",

()=>{


    window.layoutManager =

    new LayoutManager();



});



