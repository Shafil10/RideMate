import { Smartphone } from "lucide-react";

export default function AppPreview(){

return(

<section
className="rm-section"
style={{
background:
"linear-gradient(135deg,#ecfdf5,#dcfce7)"
}}
>

<div className="app-preview-row">

<div className="app-preview-copy">

<h1
style={{
fontSize:"58px"
}}
>

Ride Anywhere

Plan Anytime

</h1>

<p
style={{
fontSize:"22px",
lineHeight:"38px",
color:"#555"
}}
>

Book rides, create commutes, join friends,
track savings and help make Dhaka greener.

</p>

<button
style={{
marginTop:"35px",
padding:"18px 40px",
background:"#16a34a",
color:"white",
border:"none",
borderRadius:"35px",
fontSize:"18px"
}}
>

Coming Soon

</button>

</div>

<div
className="app-preview-phone"
style={{
background:"white",
borderRadius:"45px",
boxShadow:"0 30px 60px rgba(0,0,0,.12)",
display:"grid",
placeItems:"center"
}}
>

<Smartphone
size={120}
color="#16a34a"
/>

</div>

</div>

</section>

);

}