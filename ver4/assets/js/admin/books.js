/*
=================================================

NightCast Ver4
Admin Books Manager

Responsible for:
- Books List
- Create Book
- Edit Book
- Delete Book
- Cover Upload

=================================================
*/


"use strict";







class BooksManager {



    constructor(){



        this.currentPage = 1;


        this.limit = 20;


        this.init();



    }









    async init(){



        if(

            !Auth.requireAuth()

        ){

            return;

        }








        this.bindEvents();



        await this.load();



    }









    /*
    ==========================
    EVENTS
    ==========================
    */


    bindEvents(){



        document

        .getElementById(

            "addBook"

        )

        ?.addEventListener(

            "click",

            ()=>this.openCreate()

        );








        document

        .getElementById(

            "saveBook"

        )

        ?.addEventListener(

            "click",

            ()=>this.save()

        );



    }









    /*
    ==========================
    LOAD BOOKS
    ==========================
    */


    async load(){



        try{



            Loader.show(

                "در حال دریافت کتاب‌ها..."

            );








            const result =

            await API.get(

                `/admin/books?page=${this.currentPage}&limit=${this.limit}`

            );








            if(

                !result.success

            ){



                throw new Error(

                    result.message ||

                    "خطا در دریافت کتاب‌ها"

                );



            }








            this.render(

                result.data

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
    ==========================
    RENDER BOOK TABLE
    ==========================
    */


    render(data){



        const tbody =

        document.querySelector(

            "#bookTableBody"

        );








        if(

            !tbody

        ){

            return;

        }








        tbody.innerHTML = "";








        const books =

        data.items ||

        data;








        books.forEach(

            book=>{



                tbody.innerHTML += `

                <tr>



                    <td>

                        ${book.id}

                    </td>





                    <td>

                        <div class="book-info">


                            <img

                            src="${

                            book.cover ||

                            "/ver4/assets/images/book-default.png"

                            }"

                            class="book-cover"

                            >


                            <span>

                            ${book.title}

                            </span>


                        </div>

                    </td>





                    <td>

                        ${

                        book.author ||

                        "-"

                        }

                    </td>





                    <td>

                        ${

                        book.category ||

                        "-"

                        }

                    </td>





                    <td>

                        <span class="badge badge-success">

                            ${

                            book.status ||

                            "published"

                            }

                        </span>

                    </td>





                    <td>

                        ${

                        UI.formatDate(

                            book.created_at

                        )

                        }

                    </td>





                    <td>


                        <div class="action-group">



                            <button

                            class="action-btn action-edit"

                            onclick="booksManager.edit(${book.id})"

                            >

                            ✏️

                            </button>






                            <button

                            class="action-btn action-delete"

                            onclick="booksManager.remove(${book.id})"

                            >

                            🗑️

                            </button>



                        </div>


                    </td>



                </tr>

                `;



            }

        );



    }









    /*
    ==========================
    OPEN CREATE MODAL
    ==========================
    */


    openCreate(){



        const modal =

        document.getElementById(

            "bookModal"

        );








        if(modal){



            modal.classList.add(

                "show"

            );



        }








        document.getElementById(

            "bookId"

        ).value = "";








        document.getElementById(

            "bookForm"

        )?.reset();



    }







        /*
    ==========================
    SAVE BOOK
    ==========================
    */


    async save(){



        try{



            const id =

            document.getElementById(

                "bookId"

            ).value;








            const data = {



                title:

                document.getElementById(

                    "bookTitle"

                ).value,





                author:

                document.getElementById(

                    "bookAuthor"

                ).value,





                description:

                document.getElementById(

                    "bookDescription"

                ).value,





                category:

                document.getElementById(

                    "bookCategory"

                ).value,





                status:

                document.getElementById(

                    "bookStatus"

                ).value



            };








            Loader.show(

                "در حال ذخیره کتاب..."

            );








            let result;








            if(id){



                result =

                await API.put(

                    `/admin/books/${id}`,

                    data

                );



            }

            else{



                result =

                await API.post(

                    "/admin/books",

                    data

                );



            }








            if(

                !result.success

            ){



                throw new Error(

                    result.message ||

                    "ذخیره کتاب ناموفق بود"

                );



            }








            Toast.success(

                "کتاب با موفقیت ذخیره شد"

            );








            this.closeModal();



            await this.load();







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
    ==========================
    EDIT BOOK
    ==========================
    */


    async edit(id){



        try{



            const result =

            await API.get(

                `/admin/books/${id}`

            );








            if(

                !result.success

            ){

                return;

            }








            const book =

            result.data;








            document.getElementById(

                "bookId"

            ).value = book.id;








            document.getElementById(

                "bookTitle"

            ).value = book.title;








            document.getElementById(

                "bookAuthor"

            ).value =

            book.author || "";








            document.getElementById(

                "bookDescription"

            ).value =

            book.description || "";








            document.getElementById(

                "bookCategory"

            ).value =

            book.category || "";








            document.getElementById(

                "bookStatus"

            ).value =

            book.status || "published";








            document.getElementById(

                "bookModal"

            )

            .classList.add(

                "show"

            );



        }

        catch(error){



            Toast.error(

                error.message

            );



        }



    }










    /*
    ==========================
    DELETE BOOK
    ==========================
    */

    async remove(id){

        if(
            !UI.confirm(
                "آیا از حذف این کتاب مطمئن هستید؟"
            )
        ){
            return;
        }

        try{

            Loader.show(
                "در حال حذف کتاب..."
            );

            const result =
            await API.delete(
                `/admin/books/${id}`
            );

            if(
                !result.success
            ){
                throw new Error(
                    result.message ||
                    "حذف کتاب ناموفق بود"
                );
            }

            UI.success(
                "کتاب حذف شد."
            );

            await this.load();

        }
        catch(error){

            UI.error(
                error.message
            );

        }
        finally{

            Loader.hide();

        }

    }






    /*
    ==========================
    UPLOAD COVER
    ==========================
    */

    async uploadCover(file){

        const formData =
        new FormData();

        formData.append(
            "cover",
            file
        );

        try{

            Loader.show(
                "در حال آپلود تصویر..."
            );

            const result =
            await API.upload(
                "/admin/books/upload-cover",
                formData
            );

            Loader.hide();

            if(!result.success){

                throw new Error(
                    result.message
                );

            }

            return result.data;

        }
        catch(error){

            Loader.hide();

            UI.error(
                error.message
            );

            return null;

        }

    }






    /*
    ==========================
    CLOSE MODAL
    ==========================
    */

    closeModal(){

        document
        .getElementById(
            "bookModal"
        )
        ?.classList.remove(
            "show"
        );

    }

}







/*
=================================================

START

=================================================
*/

let booksManager;

document.addEventListener(
"DOMContentLoaded",
()=>{

    booksManager =
    new BooksManager();

});





    
