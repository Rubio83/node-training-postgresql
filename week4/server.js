require("dotenv").config()
const http = require("http")
const AppDataSource = require("./db")

const requestListener = async (req, res) => {
  const headers = {}
  let body = ""
  req.on("data", (chunk) => {
    body += chunk
  })
  const isValidString = (value) => {
    return typeof value === 'string' && value.trim() !== '';
  }
  const isNumber = (value) => {
    return typeof value === 'number' && !isNaN(value);
  }

  if (req.url === "/api/credit-package" && req.method === "GET") {
    try
    {
      const data = await AppDataSource.getRepository('CreditPackage').find({
         select :['id','name','credit_amount','price']
      })
      res.writeHead(200, headers)
      res.write(JSON.stringify({
      status: "success",
      data:data,
    }))
    res.end() 

    }catch(error){
      res.writeHead(500, headers)
      res.write(JSON.stringify({
      status: "error",
      message: "伺服器錯誤",
    }))
    res.end()
    }
    
  } else if (req.url === "/api/credit-package" && req.method === "POST") {
    req.on('end', async () => {
      try {
        const { name, credit_amount, price} = JSON.parse(body);
        if(!isValidString(name) || !isNumber(credit_amount) || !isNumber(price)){
            res.writeHead(400, headers)
            res.write(JSON.stringify({
            status: "failed",
            message: "欄位未正確填寫",
            }))
            res.end()
            return
        }

        const creditPackage = AppDataSource.getRepository('CreditPackage')
        const findcreditPackage = await creditPackage.find({
            where:
            {
              name :name
            }
        })
        if(findcreditPackage.length >0)
        {
          res.writeHead(409, headers)
          res.write(JSON.stringify({
          status: "failed",
          data: "資料重複",
          }))
          res.end() 
        }

        const newCreditPackage = creditPackage.create({
          name,
          credit_amount,
          price
        })

        const result = await creditPackage.save(newCreditPackage)

        res.writeHead(200, headers)
        res.write(JSON.stringify({
        status: "success",
        data:result,
        }))
        res.end() 
    
      } catch (error) {
        res.writeHead(500, headers)
        res.write(JSON.stringify({
        status: "error",
        message: "伺服器錯誤",
      }))
      res.end()
      }
    })
    
  } else if (req.url.startsWith("/api/credit-package/") && req.method === "DELETE") {
    try{
      const creditPackageId = req.url.split('/').pop();

      if(!isValidString(creditPackageId)){
        res.writeHead(400, headers)
        res.write(JSON.stringify({
        status: "failed",
        data:"ID錯誤",
        }))
        res.end()
        return 
      }

      const result = await AppDataSource.getRepository('CreditPackage').delete(creditPackageId)
      if(result.affected ===0){
        res.writeHead(400, headers)
        res.write(JSON.stringify({
        status: "failed",
        data:"ID錯誤",
        }))
        res.end()
        return 
      }
      res.writeHead(200, headers)
        res.write(JSON.stringify({
        status: "success",
        data:creditPackageId,
        }))
        res.end() 

    }catch(error){
      res.writeHead(500, headers)
      res.write(JSON.stringify({
      status: "error",
      message: "伺服器錯誤",
    }))
    res.end()
    }
  } else if (req.method === "OPTIONS") {
    res.writeHead(200, headers)
    res.end()
  } else {
    res.writeHead(404, headers)
    res.write(JSON.stringify({
      status: "failed",
      message: "無此網站路由",
    }))
    res.end()
  }
}

const server = http.createServer(requestListener)

async function startServer() {
  await AppDataSource.initialize()
  console.log("資料庫連接成功")
  server.listen(process.env.PORT)
  console.log(`伺服器啟動成功, port: ${process.env.PORT}`)
  return server;
}

module.exports = startServer();
