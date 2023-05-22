const fs = require('fs')
const path = require("path");
// <script src="js/pdf.js"></script>
const pdfjsLib = window['pdfjs-dist/build/pdf'];
// The workerSrc property shall be specified.
pdfjsLib.GlobalWorkerOptions.workerSrc = 'js/pdf.worker.js'
function getDocument(url) {
    return new Promise((resolve,reject)=>{
        const loadingTask = pdfjsLib.getDocument(url);
        loadingTask.promise.then(function (pdf){
            resolve(pdf)
        },function (reason){
            reject(reason)
        })

    })
}
function getPage(pdf,pageNumber) {
    return new Promise((resolve,reject)=>{
        pdf.getPage(pageNumber).then(function(page) {
            resolve(page)
        },function (reason) {
            reject(reason)
        })
    })
}
function renderPageToCanvas(page,canvas,scale = 1.5) {
    return new Promise((resolve,reject)=>{
        // Prepare canvas using PDF page dimensions
        const viewport = page.getViewport({scale: scale});
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        // Render PDF page into canvas context
        // const transform = scale !== 1
        //     ? [scale, 0, 0, scale, 0, 0]
        //     : null;

        const renderContext = {
            canvasContext: context,
            // transform,
            viewport
        };
        const renderTask = page.render(renderContext);
        renderTask.promise.then(function () {
            resolve(true)
        })
    })
}
function canvasToNodeBuffer(canvas){
    return new Promise(resolve => {
        canvas.toBlob(function(blob){
            blob.arrayBuffer().then(res=>{
                const buffer = Buffer.from(res)
                resolve(buffer)
            })
        }, "image/jpeg",1 ); // JPEG at 100% quality
    })
}
function writeCanvasToFile(canvas, path) {
    return new Promise(async (resolve,reject) => {
        const buffer = await canvasToNodeBuffer(canvas)
        fs.writeFile(path,buffer,(err)=>{
            if(err){
                reject(err)
            }else {
                resolve()
            }
        })
    })
}

async function pdf2Image(url,dir,canvas,scale) {
    const pdf =  await getDocument(url)
    const numPages = pdf.numPages
    // Asynchronous download of PDF
    console.log(`PDF loaded success : ${numPages} page`);
    fs.mkdirSync(dir,{recursive:true})
    for (let num = 1; num <= numPages; num++) {
        const page = await getPage(pdf,num)
        await renderPageToCanvas(page,canvas,scale)
        await writeCanvasToFile(canvas,path.resolve(dir,`${num}.png`))
        console.log(`page ${num} is render ok`);
    }
    console.log(`pdf is handle success: ${dir}`);

}



