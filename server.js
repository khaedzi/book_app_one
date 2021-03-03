'use strict'

const express = require('express');
const cors = require('cors');
const superAgent = require('superagent');
require('dotenv').config();
const pg = require('pg');
const app = express();

// { connectionString: process.env.DATABASE_URL,   ssl: { rejectUnauthorized: false } }
// process.env.databaseUrl
// let client =new pg.Client(process.env.databaseUrl);

const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
app.use(express.static('public'))
app.set('view engine', 'ejs');
app.use(cors());
app.use(express.urlencoded({extended:true}))
const baseAPIUrl = 'https://www.googleapis.com/books/v1/volumes';

const methodOverRide=require('method-override');
app.use(methodOverRide('_method'))


app.get("/",handleHome)


app.get('/searches/new', handleSearches)

app.post('/searches', handleSearch)

app.delete("/deleteData/:id",deltepage)

app.get("/books/:id", handleBook)
app.post("/books", handleSelectedBook)
app.put("/updateData/:id",handleupdateTask)

function deltepage(req,res){
    let myDataDelete='Delete from favourite WHERE id=$1;'
    let mykey=[req.query.id];
    client.query(myDataDelete,mykey).then(()=>{
res.redirect("/")

    })
}



app.get("/books/:id", handleBook)
app.post("/books", handleSelectedBook)



function Book(img_url, title, author_name, description, isbn){
    this.img_url = img_url;
    this.title = title;
    this.authorName = author_name;
    this.description = description || '';
    this.isbn = isbn;
}



function handleupdateTask(req,res){
    let formData = req.body;
    console.log(formData);
    let safeValues = [formData.title, formData.description, formData.author, formData.isbn,req.params.id];
   let mydata=`UPDATE favourite SET title=$1,description=$2,author=$3,isbn=$4 WHERE id=$5;`
    client.query(mydata,safeValues).then(()=>{

        res.redirect(`/books/${req.params.id}`)
    })
}

function handleSearches(req, res){
    res.render('pages/searches/new');
}
function handleHome(req,res){
getdataFromDb().then(data=>{

    res.render('pages/index',{data:data,length:data.length});
});
}

function handleBook(req, res){
    getDataFromFavourite(req.params.id).then(data =>{
        res.render('pages/books/detail', {book: data})
    })
   
}

function handleSelectedBook(req, res){
    let formData = req.body;
    let safeValues = [formData.title, formData.description, formData.authorName, formData.isbn, formData.img_url];
    let insertQuery = 'INSERT INTO favourite(title, description, author, isbn, image_url) VALUES($1, $2, $3, $4, $5) RETURNING *;'

    client.query(insertQuery, safeValues).then(data =>{
        res.redirect(`/books/${data.rows[0].id}`)
    })
}

function getDataFromFavourite(id){
    let findBook = 'SELECT * FROM favourite WHERE id = $1'
    return client.query(findBook, [id]).then(book =>{
        return book.rows[0];
    })
}
function getdataFromDb(){
    
    let myData="select * from favourite;"
    return client.query(myData).then(data => {
    return data.rows;
})}

function handleSearch(req, res){
    getBooksData(req.body.searchQuery, req.body.searchBy).then(data =>{
        res.render('pages/searches/show', {books:data})
    }).catch(error => res.render('pages/error', {error:error}))
}

function handleError(error){
    console.log("error", error);
}
function getBooksData(searchQuery, searchBy){
    let searchParams = `${searchQuery}+in${searchBy}`
    const query = {
        q: searchParams,
    }
    return superAgent.get(baseAPIUrl).query(query).then(books =>{
        return books.body.items.map(book =>{
            let results = book.volumeInfo;
            if(typeof results.authors === 'undefined'){
                results.authors = ['']
            }
            if(typeof results.imageLinks === 'undefined'){
                results.imageLinks= {thumbnail: `https://i.imgur.com/J5LVHEL.jpg`}
            } else{
                results.imageLinks.thumbnail = results.imageLinks.thumbnail.replace(/(http:)/, "https:")
            }
            if(typeof results.industryIdentifiers === 'undefined' || typeof results.industryIdentifiers[1] === 'undefined'){
                results.industryIdentifiers = ['', {identifier: ''}];
            }
            
            return new Book(results.imageLinks.thumbnail , results.title, results.authors[0],results.description, results.industryIdentifiers[1].identifier)
  
        })
    }).catch(handleError)
}

client.connect().then(()=>{

app.listen(process.env.PORT, () =>{
    console.log("Listening on port " + process.env.PORT)
})}).catch(handleError)

