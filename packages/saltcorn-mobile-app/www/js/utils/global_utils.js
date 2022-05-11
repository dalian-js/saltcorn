async function apiCall({ method, path, params, body }) {
  const serverPath = config.server_path;
  const token = localStorage.getItem("auth_jwt");
  const url = `${serverPath}${path}`;
  try {
    return await axios({
      url: url,
      method: method,
      params: params,
      headers: {
        Authorization: `jwt ${token}`,
        "X-Requested-With": "XMLHttpRequest",
        "X-Saltcorn-Client": "mobile-app",
      },
      data: body,
    });
  } catch (error) {
    console.log(`error while calling: ${method} ${url}`);
    console.log(JSON.stringify(error));
    throw error;
  }
}

function splitPathQuery(url) {
  let path = url;
  let query = undefined;
  const queryStart = url.indexOf("?");
  if (queryStart > 0) {
    path = url.substring(0, queryStart);
    query = url.substring(queryStart);
  }
  return { path, query };
}

function replaceIframe(content) {
  let iframe = document.getElementById("content-iframe");
  iframe.contentWindow.document.open();
  iframe.contentWindow.document.write(content);
  iframe.contentWindow.document.close();
}

function replaceIframeInnerContent(content) {
  const iframe = document.getElementById("content-iframe");
  const iframeDocument = iframe.contentWindow.document;
  let innerContentDiv = iframeDocument.getElementById("page-inner-content");
  innerContentDiv.innerHTML = content;
  let scripts = innerContentDiv.getElementsByTagName("script");
  for (let script of scripts) {
    iframe.contentWindow.eval(script.innerHTML);
  }
  const scmodal = iframe.contentWindow.$("#scmodal");
  if (scmodal) {
    scmodal.modal("hide");
  }
}

async function gotoEntryView() {
  const entryPath = config.entry_view;
  const page = await router.resolve({
    pathname: entryPath,
  });
  window.currentLocation = entryPath;
  window.currentQuery = undefined;
  replaceIframeInnerContent(page.content);
}

async function handleRoute(route, query) {
  if (route === "/") return await gotoEntryView();
  window.currentLocation = route;
  window.currentQuery = query;
  const page = await router.resolve({ pathname: route, query: query });
  if (page.redirect) {
    const { path, query } = splitPathQuery(page.redirect);
    await handleRoute(path, query);
  } else if (page.content) {
    replaceIframeInnerContent(page.content);
  }
}
