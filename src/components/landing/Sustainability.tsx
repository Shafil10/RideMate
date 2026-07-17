import { Leaf, Coins, Car } from "lucide-react";

export default function Sustainability(){

const cards=[
{
icon:<Leaf size={45} color="green"/>,
title:"Reduce CO₂",
text:"Every shared ride helps reduce carbon emissions."
},
{
icon:<Coins size={45} color="green"/>,
title:"Green Rewards",
text:"Earn RidePoints and redeem at campus cafés."
},
{
icon:<Car size={45} color="green"/>,
title:"Less Traffic",
text:"Fewer cars around campus means smoother commutes."
}
];

return(

<section
style={{
padding:"100px",
background:"#f8fafc"
}}
>

<h1
style={{
textAlign:"center",
fontSize:"48px",
marginBottom:"60px"
}}
>

Sustainability Matters

</h1>

<div
style={{
display:"flex",
gap:"30px"
}}
>

{cards.map((c)=>(
<div
key={c.title}
style={{
flex:1,
background:"white",
padding:"40px",
borderRadius:"20px",
boxShadow:"0 15px 30px rgba(0,0,0,.06)"
}}
>

{c.icon}

<h2>{c.title}</h2>

<p>{c.text}</p>

</div>
))}

</div>

</section>

);

}