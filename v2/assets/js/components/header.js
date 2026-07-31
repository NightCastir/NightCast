const Header = {

    init() {

        this.render();

        this.events();

    },

    render() {

        document
            .getElementById("header")
            .innerHTML = `

<div class="header-container">

    HEADER

</div>

`;

    },

    events() {

    }

};
