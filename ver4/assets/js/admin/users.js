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



    /*
    ========================================
    LOAD USERS
    ========================================
    */


    async loadUsers(){


        try{


            Loader.show(

                "در حال دریافت کاربران..."

            );




            const result =

            await API.get(

                "/users"

            );





            if(!result.success){



                throw new Error(

                    result.message ||

                    "دریافت کاربران ناموفق بود"

                );



            }







            this.users =

            result.users || [];





            this.filteredUsers =

            [

                ...this.users

            ];







            this.render();





            this.updateCounter();





        }



        catch(error){



            console.error(error);



            Toast.error(

                error.message

            );



        }



        finally{



            Loader.hide();



        }


    }









    /*
    ========================================
    RENDER TABLE
    ========================================
    */


    render(){



        if(!this.table)

        return;







        if(

            this.filteredUsers.length===0

        ){



            this.table.innerHTML =

            `

            <tr>

            <td colspan="7">

            کاربری ثبت نشده است

            </td>

            </tr>

            `;



            return;


        }









        this.table.innerHTML =




        this.filteredUsers.map(

        (user,index)=>`



        <tr>



        <td>

        ${index+1}

        </td>





        <td>

        ${

        user.full_name || "-"

        }

        </td>





        <td>

        ${

        user.email || "-"

        }

        </td>





        <td>


        <span class="badge">

        ${

        user.role==="admin"

        ?

        "مدیر"

        :

        "شنونده"

        }


        </span>


        </td>







        <td>


        <span class="badge

        ${

        user.status==="active"

        ?

        "badge-success"

        :

        "badge-warning"

        }

        ">


        ${

        user.status==="active"

        ?

        "فعال"

        :

        "مسدود"

        }



        </span>


        </td>







        <td>

        ${

        user.last_login || "-"

        }


        </td>







        <td>



        <button

        class="btn btn-sm"

        data-action="edit"

        data-id="${user.id}"

        >

        ویرایش

        </button>







        <button

        class="btn btn-danger btn-sm"

        data-action="delete"

        data-id="${user.id}"

        >

        حذف

        </button>





        </td>





        </tr>



        `)

        .join("");





    }









    /*
    ========================================
    COUNTER
    ========================================
    */


    updateCounter(){



        if(this.counter){



            this.counter.innerText =


            `${this.filteredUsers.length} کاربر`;



        }



    }









    /*
    ========================================
    FILTER
    ========================================
    */


    filter(){



        const keyword =

        this.search.value

        .trim()

        .toLowerCase();







        const role =

        this.roleFilter.value;






        const status =

        this.statusFilter.value;








        this.filteredUsers =



        this.users.filter(

        user=>{


            const text =

            (

            user.full_name +

            " " +

            user.email +

            " " +

            user.phone

            )

            .toLowerCase();







            const searchMatch =

            text.includes(

                keyword

            );







            const roleMatch =


            role===""

            ||

            user.role===role;







            const statusMatch =


            status===""

            ||

            user.status===status;







            return (

                searchMatch

                &&

                roleMatch

                &&

                statusMatch

            );



        });



        this.render();


        this.updateCounter();



    }






    /*
    ========================================
    TABLE EVENTS
    ========================================
    */


    tableEvents(event){



        const button =

        event.target.closest(

            "button[data-action]"

        );





        if(!button)

        return;





        const action =

        button.dataset.action;





        const id =

        button.dataset.id;






        if(action==="edit"){



            this.edit(id);



        }






        if(action==="delete"){



            this.delete(id);



        }



    }









    /*
    ========================================
    OPEN CREATE
    ========================================
    */


    openCreate(){



        this.currentUser = null;



        this.resetForm();





        this.modal.classList.add(

            "show"

        );



    }









    /*
    ========================================
    EDIT USER
    ========================================
    */


    async edit(id){



        try{



            Loader.show(

                "در حال دریافت اطلاعات..."

            );






            const result =

            await API.get(

                "/users/" + id

            );






            if(!result.success){



                throw new Error(

                    result.message ||

                    "کاربر پیدا نشد"

                );


            }








            this.currentUser =

            result.user;







            this.fillForm(

                result.user

            );






            this.modal.classList.add(

                "show"

            );






        }



        catch(error){



            Toast.error(

                error.message

            );



        }




        finally{


            Loader.hide();


        }


    }









    /*
    ========================================
    FILL FORM
    ========================================
    */


    fillForm(user){





        document.getElementById(

            "userId"

        ).value =

        user.id || "";







        document.getElementById(

            "fullName"

        ).value =

        user.full_name || "";








        document.getElementById(

            "username"

        ).value =

        user.username || "";








        document.getElementById(

            "email"

        ).value =

        user.email || "";








        document.getElementById(

            "phone"

        ).value =

        user.phone || "";








        document.getElementById(

            "userRole"

        ).value =

        user.role || "listener";








        document.getElementById(

            "accountStatus"

        ).value =

        user.status || "active";








        document.getElementById(

            "adminNote"

        ).value =

        user.admin_note || "";



    }









    /*
    ========================================
    CLOSE MODAL
    ========================================
    */


    close(){



        this.modal.classList.remove(

            "show"

        );



    }









    /*
    ========================================
    RESET FORM
    ========================================
    */


    resetForm(){



        this.form.reset();



        document.getElementById(

            "userId"

        ).value = "";



            }







        /*
    ========================================
    SAVE USER
    ========================================
    */


    async save(){



        try{



            if(!this.validate()){


                return;


            }








            const id =

            document.getElementById(

                "userId"

            ).value;







            const data = {



                full_name:

                document.getElementById(

                    "fullName"

                ).value.trim(),





                username:

                document.getElementById(

                    "username"

                ).value.trim(),





                email:

                document.getElementById(

                    "email"

                ).value.trim(),





                phone:

                document.getElementById(

                    "phone"

                ).value.trim(),





                role:

                document.getElementById(

                    "userRole"

                ).value,





                status:

                document.getElementById(

                    "accountStatus"

                ).value,





                admin_note:

                document.getElementById(

                    "adminNote"

                ).value.trim()




            };









            Loader.show(

                "در حال ذخیره کاربر..."

            );









            let result;







            if(id){



                result =

                await API.put(

                    "/users/" + id,

                    data

                );



            }

            else{



                result =

                await API.post(

                    "/users",

                    data

                );



            }








            if(!result.success){



                throw new Error(

                    result.message ||

                    "ذخیره کاربر انجام نشد"

                );


            }







            Toast.success(

                id

                ?

                "اطلاعات کاربر بروزرسانی شد"

                :

                "کاربر جدید ثبت شد"

            );







            this.close();



            await this.loadUsers();







        }


        catch(error){



            Toast.error(

                error.message

            );



        }



        finally{


            Loader.hide();


        }



    }









    /*
    ========================================
    VALIDATION
    ========================================
    */


    validate(){



        const name =

        document.getElementById(

            "fullName"

        ).value.trim();







        if(!name){



            Toast.warning(

                "نام کاربر الزامی است"

            );



            return false;



        }







        return true;



    }









    /*
    ========================================
    DELETE USER
    ========================================
    */


    async delete(id){



        if(

            !confirm(

            "آیا از حذف این کاربر مطمئن هستید؟"

            )

        )

        return;







        try{



            Loader.show(

                "در حال حذف کاربر..."

            );







            const result =

            await API.delete(

                "/users/" + id

            );







            if(!result.success){



                throw new Error(

                    result.message ||

                    "حذف کاربر انجام نشد"

                );


            }







            Toast.success(

                "کاربر حذف شد"

            );







            await this.loadUsers();






        }


        catch(error){



            Toast.error(

                error.message

            );



        }



        finally{


            Loader.hide();


        }


    }



}









/*
=================================================

START USERS MANAGER

=================================================
*/


let usersManager;



document.addEventListener(

"DOMContentLoaded",

()=>{


    usersManager =

    new UsersManager();



});
