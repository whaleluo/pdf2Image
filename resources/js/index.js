function initLogger(id) {
    const log = document.getElementById(id)
    const silentLog = console.log;
    const addLogEntry = function (message, prompt = '-> ') {
        let entry = document.createElement('li');
        entry.style = "list-style: none";
        entry.textContent = prompt + message;
        log.appendChild(entry);
        log.scrollTop = log.scrollHeight;
    }
    const clearLog = function () {
        log.textContent = '';
    }
    const logInfo = function (val) {
        addLogEntry(val);
        silentLog(val)
    }
    console.log = logInfo;
    return {
        log,
        logInfo,
        silentLog,
        clearLog
    }
}

function initParamsEventListener() {
    let input_scale = 1,
        input_quality = 0.8,
        input_format = 'image/png',
        output_dir = ''
    pdf_path = '';

    const scale_input = document.getElementById('scale_input');
    scale_input.addEventListener('input', function () {
        input_scale = Number(this.value);
        const output_scale = document.getElementById('output_scale_input');
        output_scale.value = input_scale;
    });

    const quality_input = document.getElementById('quality_input');
    quality_input.addEventListener('input', function () {
        input_quality = Number(this.value);
        const output_quality = document.getElementById('output_quality_input');
        output_quality.value = input_quality;
    });

    const format_select = document.getElementById('format_select');
    format_select.addEventListener('change', function onFormatSelect() {
        input_format = this.value;
    });

    const input_pdf = document.getElementById('pdf_input');
    input_pdf.addEventListener('input', function inputReadPdf() {
        const file = this.files[0]
        if (!file) {
            return;
        }
        // logger.clearLog();

        const selected_file_name = document.getElementById('selected_file_name');

        if (file.type != 'application/pdf') {
            console.log(file.name + " - Unsupported file format, Select a PDF file!!");
            selected_file_name.value = file.name + " - Unsupported file format!!";
            resetPreview();
            return;
        }
        const {
            lastModified,
            lastModifiedDate,
            name,
            path,
            size,
            type
        } = file
        selected_file_name.value = name;

        pdf_path = path
        console.log(name)
        console.log(path)
        console.log(size)
        console.log(type)
        console.log(lastModifiedDate)

        updatePreview(pdf_path)

    });

    const input_pdf_overlay = document.getElementById('pdf_input_overlay');
    input_pdf_overlay.addEventListener('click', () => {
        input_pdf.click()
    });

    const output_dir_button = document.getElementById('output_dir');
    output_dir_button.addEventListener('click', () => {
        window.ipcRenderer.invoke('select-Directory').then(res => {
            console.log(res == undefined ? '取消选择文件夹' : `输出目录: ${res}`)
            const output_dir_name = document.getElementById('output_dir_name');
            output_dir_name.value = (res == undefined ? '' : res)
            output_dir = (res == undefined ? '' : res)
        })
    })

    const convert_pdf = document.getElementById('convert_pdf');
    convert_pdf.addEventListener('click', convertPdf);

    const clear_log = document.getElementById('clear_log');
    clear_log.addEventListener('click', () => {
        logger.clearLog()
    });
    const toggleStates = function (enable) {
        const disabled = !enable;
        input_pdf.disabled = disabled;
        format_select.disabled = disabled;
        quality_input.disabled = disabled;
        scale_input.disabled = disabled;
        convert_pdf.disabled = disabled;
    }
    const updatePreview = function (url) {
        document.getElementById('pdf_preview').src = url + '#toolbar=0';
    }

    const resetPreview = function () {
        document.getElementById('pdf_preview').src = 'placeholder/preview.pdf' + '#toolbar=0';
    }

    const getData = function () {
        return {
            input_scale,
            input_quality,
            input_format,
            pdf_path,
            output_dir
        }
    }
    return {
        toggleStates,
        getData
    }
}


const logger = initLogger('log')
const params = initParamsEventListener()


async function convertPdf() {
    if (!params.getData().pdf_path) {
        window.ipcRenderer.invoke('dialog-show', '请选择一个【pdf文档】')
        return
    }
    if (!params.getData().output_dir) {
        window.ipcRenderer.invoke('dialog-show', '请选择一个【输出目录】保存分割后的图片')
        return
    }
    const canvas = document.getElementById('page_canvas');
    params.toggleStates(false);
    // logger.clearLog();
    console.log("Loading selected file...");
    console.log(params.getData().pdf_path)
    console.log(params.getData().input_scale)

    await pdf2Image(params.getData().pdf_path, params.getData().output_dir, canvas, params.getData().input_scale)
    params.toggleStates(true);
    await window.ipcRenderer.invoke('success')

}