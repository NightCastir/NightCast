/*
=================================================

NightCast Ver4
Users Manager

Responsible for:
- User Management
- Create / Update / Delete
- Role Control
- Status Management

=================================================
*/


"use strict";



class UsersManager {



    constructor(){


        this.users = [];


        this.filteredUsers = [];


        this.currentUser = null;


        this.init();


    }









    /*
    ========================================
    INIT
    ========================================
    */


    async init(){


        this.cacheDOM();


        this.bindEvents();


        await this.loadUsers();



    }









    /*
    ========================================
    CACHE DOM
    ========================================
    */


    cacheDOM(){



        this.table =

        document.getElementById(

            "usersTable"

        );





        this.counter =

        document.getElementById(

            "userCount"

        );





        this.modal =

        document.getElementById(

            "userModal"

        );





        this.form =

        document.getElementById(

            "userForm"

        );





        this.search =

        document.getElementById(

            "userSearch"

        );





        this.roleFilter =

        document.getElementById(

            "roleFilter"

        );





        this.statusFilter =

        document.getElementById(

            "userStatus"

        );





        this.btnNew =

        document.getElementById(

            "btnNewUser"

        );





        this.btnSave =

        document.getElementById(

            "saveUser"

        );





        this.btnCancel =

        document.getElementById(

            "cancelUser"

        );





        this.btnClose =

        document.getElementById(

            "closeUserModal"

        );





        this.btnRefresh =

        document.getElementById(

            "btnRefreshUsers"

        );



    }









    /*
    ========================================
    EVENTS
    ========================================
    */


    bindEvents(){



        this.btnNew?.addEventListener(

            "click",

            ()=>this.openCreate()

        );





        this.btnSave?.addEventListener(

            "click",

            ()=>this.save()

        );





        this.btnCancel?.addEventListener(

            "click",

            ()=>this.close()

        );





        this.btnClose?.addEventListener(

            "click",

            ()=>this.close()

        );





        this.btnRefresh?.addEventListener(

            "click",

            ()=>this.loadUsers()

        );





        this.search?.addEventListener(

            "input",

            ()=>this.filter()

        );





        this.roleFilter?.addEventListener(

            "change",

            ()=>this.filter()

        );





        this.statusFilter?.addEventListener(

            "change",

            ()=>this.filter()

        );





        this.table?.addEventListener(

            "click",

            (e)=>this.tableEvents(e)

        );



    }
