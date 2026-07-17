export default function Universities() {

const universities=[
"North South University",
"BRAC University",
"AIUB",
"East West University",
"University of Dhaka",
"UIU",
"DIU",
"IUB"
];

return(

<section
style={{
padding:"100px",
background:"#fff"
}}
>

<h1
style={{
textAlign:"center",
fontSize:"48px",
marginBottom:"60px"
}}
>
Partner Universities
</h1>

<div
style={{
display:"grid",
gridTemplateColumns:"repeat(4,1fr)",
gap:"25px"
}}
>

{universities.map((u)=>(
<div
key={u}
style={{
padding:"35px",
background:"#f8fafc",
borderRadius:"20px",
textAlign:"center",
boxShadow:"0 8px 20px rgba(0,0,0,.05)"
}}
>

<div
style={{
width:"70px",
height:"70px",
margin:"0 auto 20px",
borderRadius:"50%",
background:"#16a34a",
color:"white",
display:"grid",
placeItems:"center",
fontSize:"28px",
fontWeight:"bold"
}}
>

{u.charAt(0)}

</div>

<h3>{u}</h3>

</div>
))}

</div>

</section>

);

}