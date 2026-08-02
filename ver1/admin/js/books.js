
/* =====================
   NIGHTCAST BOOKS MODULE
===================== */


document.addEventListener(
"DOMContentLoaded",
async function(){



// =====================
// AUTH CHECK
// =====================


const admin =

await NightCastAuth.check();



if(!admin){

return;

}



// =====================
// LOAD AUTHORS
// =====================


await loadAuthors();



// =====================
// LOAD CATEGORIES
// =====================


await loadCategories();



// =====================
// LOAD BOOKS
// =====================


await loadBooks();




// =====================
// SAVE BUTTON
// =====================


const saveButton =

document.getElementById(
"saveBook"
);



if(saveButton){


saveButton.addEventListener(
"click",
saveBook
);


}


});





// =====================
// LOAD AUTHORS
// =====================


async function loadAuthors(){



const token =

sessionStorage.getItem(
"NightCastSession"
);



const response =

await fetch(

API + "/api/authors",

{

headers:{

"Authorization":

"Bearer " + token

}

}

);



const data =

await response.json();



const select =

document.getElementById(
"authorSelect"
);



select.innerHTML="";



if(data.success && data.authors.length){



data.authors.forEach(

author=>{


const option =

document.createElement(
"option"
);


option.value =
author.id;


option.textContent =
author.name;


select.appendChild(option);


}

);



}

else{


select.innerHTML=

`
<option>
نویسنده‌ای وجود ندارد
</option>
`;


}


}






// =====================
// LOAD CATEGORIES
// =====================


async function loadCategories(){


const token =

sessionStorage.getItem(
"NightCastSession"
);



const response =

await fetch(

API + "/api/categories",

{

headers:{

"Authorization":

"Bearer " + token

}

}

);



const data =

await response.json();



const select =

document.getElementById(
"categorySelect"
);



select.innerHTML="";



if(data.success && data.categories.length){



data.categories.forEach(

category=>{


const option =

document.createElement(
"option"
);


option.value =
category.id;


option.textContent =
category.name;


select.appendChild(option);


}

);


}

else{


select.innerHTML=

`
<option>
دسته‌بندی وجود ندارد
</option>
`;


}


}






// =====================
// SAVE BOOK
// =====================


async function saveBook(){



const token =

sessionStorage.getItem(
"NightCastSession"
);




const book = {


author_id:

document.getElementById(
"authorSelect"
).value || null,



category_id:

document.getElementById(
"categorySelect"
).value || null,



title:

document.getElementById(
"bookTitle"
).value.trim(),



slug:

document.getElementById(
"bookSlug"
).value.trim(),



description:

document.getElementById(
"description"
).value,



publish_year:

document.getElementById(
"publishYear"
).value || null,



pages:

document.getElementById(
"pages"
).value || null,



cover_url:

document.getElementById(
"coverUrl"
).value || null,



status:

document.getElementById(
"status"
).value


};




if(!book.title || !book.slug){


NightCastUI.error(

"عنوان و Slug الزامی است"

);


return;


}





const response =

await fetch(

API + "/api/books",

{

method:"POST",


headers:{


"Content-Type":
"application/json",


"Authorization":

"Bearer " + token


},



body:

JSON.stringify(book)


}

);





const data =

await response.json();



console.log(
"CREATE BOOK:",
data
);





if(data.success){



NightCastUI.success(

"کتاب با موفقیت ثبت شد"

);



await loadBooks();


}

else{


NightCastUI.error(

data.message ||

"خطا در ثبت کتاب"

);


}


}






// =====================
// LOAD BOOKS LIST
// =====================


async function loadBooks(){


const token =

sessionStorage.getItem(
"NightCastSession"
);



const response =

await fetch(

API + "/api/books",

{

headers:{

"Authorization":

"Bearer " + token

}

}

);



const data =

await response.json();



const box =

document.getElementById(
"booksList"
);



if(!data.success){


box.innerHTML=

"خطا در دریافت کتاب‌ها";


return;

}




if(!data.books.length){


box.innerHTML=

"کتابی ثبت نشده است";


return;


}




box.innerHTML="";



data.books.forEach(

book=>{


box.innerHTML += `


<div class="nc-card">


<h3>

${book.title}

</h3>


<p>

${book.description || ""}

</p>


</div>


`;


}

);



  }
