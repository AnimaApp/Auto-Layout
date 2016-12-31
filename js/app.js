
<script>
const myJSON = {ans: 42};

const formatter = new JSONFormatter(myJSON);

document.body.appendChild(formatter.render());
</script>