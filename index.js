let cool = require("cool-ascii-faces");

const app = express();
app.use("/",express.static("./static"));

app.get(BASE_URL_API+"/contacts", (req,res)=>{
  res.send(`<html><body><h1>
            ${cool()}
            <h1><body><html></html>`)
});

app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});