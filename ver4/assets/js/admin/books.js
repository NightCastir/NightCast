
/*
=================================================

NightCast Ver4
Books Manager

Responsible for:
- Manage Books
- Create / Update / Delete
- Search & Filter
- Worker Communication

=================================================
*/


"use strict";



class BooksManager {



    constructor(){


        this.books = [];


        this.filteredBooks = [];


        this.currentBook = null;


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


        await this.loadBooks();


    }









    /*
    ========================================
    CACHE DOM
    ========================================
    */


    cacheDOM(){



        this.table =

        document.getElementById(

            "booksTable"

        );





        this.counter =

        document.getElementById(

            "bookCount"

        );





        this.modal =

        document.getElementById(

            "bookModal"

        );





        this.form =

        document.getElementById(

            "bookForm"

        );





        this.search =

        document.getElementById(

            "bookSearch"

        );





        this.status =

        document.getElementById(

            "bookStatus"

        );





        this.btnNew =

        document.getElementById(

            "btnNewBook"

        );





        this.btnSave =

        document.getElementById(

            "saveBook"

        );





        this.btnCancel =

        document.getElementById(

            "cancelBook"

        );





        this.btnClose =

        document.getElementById(

            "closeBookModal"

        );





        this.btnRefresh =

        document.getElementById(

            "btnRefreshBooks"

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

            ()=>this.loadBooks()

        );





        this.search?.addEventListener(

            "input",

            ()=>this.filter()

        );





        this.status?.addEventListener(

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
    LOAD BOOKS
    ========================================
    */


    async loadBooks(){


        try{


            Loader.show(

                "در حال دریافت کتاب‌ها..."

            );




            const result =

            await API.get(

                "/books"

            );





            if(!result.success){



                throw new Error(

                    result.message ||

                    "دریافت کتاب‌ها ناموفق بود"

                );



            }







            this.books =

            result.books || [];





            this.filteredBooks =

            [

                ...this.books

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

            this.filteredBooks.length===0

        ){



            this.table.innerHTML =

            `

            <tr>

            <td colspan="6">

            کتابی ثبت نشده است

            </td>

            </tr>

            `;



            return;


        }









        this.table.innerHTML =




        this.filteredBooks.map(

        (book,index)=>`



        <tr>



        <td>

        ${index+1}

        </td>





        <td>

        ${

        book.title || "-"

        }

        </td>





        <td>

        ${

        book.author || "-"

        }

        </td>





        <td>

        ${

        book.episodes_count || 0

        }

        </td>






        <td>


        <span class="badge

        ${

        book.status==="active"

        ?

        "badge-success"

        :

        "badge-warning"

        }

        ">



        ${

        book.status==="active"

        ?

        "فعال"

        :

        "غیرفعال"

        }



        </span>


        </td>







        <td>



        <button

        class="btn btn-sm"

        data-action="edit"

        data-id="${book.id}"

        >

        ویرایش

        </button>







        <button

        class="btn btn-danger btn-sm"

        data-action="delete"

        data-id="${book.id}"

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


            `${this.filteredBooks.length} کتاب`;



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






        const status =

        this.status.value;







        this.filteredBooks =



        this.books.filter(

        book=>{


            const title =

            (

            book.title || ""

            )

            .toLowerCase();






            const searchMatch =

            title.includes(

                keyword

            );






            const statusMatch =


            status===""

            ||

            book.status===status;







            return (

                searchMatch

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



        this.currentBook = null;



        this.resetForm();





        this.modal.classList.add(

            "show"

        );



    }









    /*
    ========================================
    EDIT BOOK
    ========================================
    */


    async edit(id){



        try{



            Loader.show(

                "در حال دریافت اطلاعات..."

            );






            const result =

            await API.get(

                "/books/" + id

            );






            if(!result.success){



                throw new Error(

                    result.message ||

                    "کتاب پیدا نشد"

                );


            }








            this.currentBook =

            result.book;







            this.fillForm(

                result.book

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


    fillForm(book){





        document.getElementById(

            "bookId"

        ).value =

        book.id || "";







        document.getElementById(

            "bookTitle"

        ).value =

        book.title || "";








        document.getElementById(

            "bookAuthor"

        ).value =

        book.author || "";








        document.getElementById(

            "bookTranslator"

        ).value =

        book.translator || "";








        document.getElementById(

            "bookCategory"

        ).value =

        book.category || "";








        document.getElementById(

            "bookDescription"

        ).value =

        book.description || "";








        document.getElementById(

            "bookSummary"

        ).value =

        book.summary || "";








        document.getElementById(

            "bookActive"

        ).value =

        book.status || "active";



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

            "bookId"

        ).value = "";



    }



      /*
    ========================================
    SAVE BOOK
    ========================================
    */


    async save(){



        try{



            if(!this.validate()){


                return;


            }








            const id =

            document.getElementById(

                "bookId"

            ).value;







            const data = {



                title:

                document.getElementById(

                    "bookTitle"

                ).value.trim(),





                author:

                document.getElementById(

                    "bookAuthor"

                ).value.trim(),





                translator:

                document.getElementById(

                    "bookTranslator"

                ).value.trim(),





                category:

                document.getElementById(

                    "bookCategory"

                ).value,





                description:

                document.getElementById(

                    "bookDescription"

                ).value.trim(),





                summary:

                document.getElementById(

                    "bookSummary"

                ).value.trim(),





                status:

                document.getElementById(

                    "bookActive"

                ).value





            };









            Loader.show(

                "در حال ذخیره کتاب..."

            );









            let result;







            if(id){



                result =

                await API.put(

                    "/books/" + id,

                    data

                );



            }

            else{



                result =

                await API.post(

                    "/books",

                    data

                );



            }








            if(!result.success){



                throw new Error(

                    result.message ||

                    "ذخیره انجام نشد"

                );


            }







            Toast.success(

                id

                ?

                "کتاب ویرایش شد"

                :

                "کتاب جدید ثبت شد"

            );







            this.close();



            await this.loadBooks();







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



        const title =

        document.getElementById(

            "bookTitle"

        ).value.trim();







        if(!title){



            Toast.warning(

                "عنوان کتاب الزامی است"

            );



            return false;



        }







        return true;



    }









    /*
    ========================================
    DELETE BOOK
    ========================================
    */


    async delete(id){



        if(

            !confirm(

            "آیا از حذف این کتاب مطمئن هستید؟"

            )

        )

        return;







        try{



            Loader.show(

                "در حال حذف کتاب..."

            );







            const result =

            await API.delete(

                "/books/" + id

            );







            if(!result.success){



                throw new Error(

                    result.message ||

                    "حذف انجام نشد"

                );


            }







            Toast.success(

                "کتاب حذف شد"

            );







            await this.loadBooks();






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

START BOOK MANAGER

=================================================
*/


let booksManager;



document.addEventListener(

"DOMContentLoaded",

()=>{


    booksManager =

    new BooksManager();



});





