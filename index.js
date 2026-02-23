let cool = require("cool-ascii-faces");
let express = require("express");
let PORT = process.env.PORT || 3000;

const app = express();
app.use("/",express.static("./static", {extensions: ["html"]}));

app.get("/", (req,res)=>{
  res.send(`<html><body><h1>
            ${cool()}
            <h1><body><html></html>`)
});

app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});