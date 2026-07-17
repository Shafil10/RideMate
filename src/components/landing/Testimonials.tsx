export default function Testimonials(){

const reviews=[

{
name:"Ayesha Rahman",
text:"RideMate reduced my monthly transport cost by almost 35%."
},

{
name:"Hasan Ahmed",
text:"I met amazing classmates while travelling together every morning."
},

{
name:"Sadia Karim",
text:"Women-only rides made my daily commute much safer."
}

];

return(

<section
style={{
padding:"100px",
background:"white"
}}
>

<h1
style={{
textAlign:"center",
fontSize:"48px",
marginBottom:"60px"
}}
>

What Students Say

</h1>

<div
style={{
display:"flex",
gap:"30px"
}}
>

{reviews.map((r)=>(
<div
key={r.name}
style={{
flex:1,
background:"#f8fafc",
padding:"35px",
borderRadius:"25px"
}}
>

<p
style={{
lineHeight:"32px",
fontSize:"18px"
}}
>

"{r.text}"

</p>

<h3
style={{
marginTop:"30px",
color:"#16a34a"
}}
>

{r.name}

</h3>

</div>
))}

</div>

</section>

);

}