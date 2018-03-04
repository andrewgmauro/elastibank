const vm = new Vue({
    el: '#vue-instance',
    data () {
        return {
            baseUrl: 'http://localhost:3000',
            searchTerm: 'DNA',
            searchDebounce: null,
            searchResults: [],
            numHits: null,
            searchOffset: 0,

            selectedParagraph: null,
            bookOffset: 0,
            paragraphs: []
        }
    },
async created() {
    this.searchResults = await this.search()
},
methods: {
    onSearchInput() {
        clearTimeout(this.searchDebounce)
        this.searchDebounce = setTimeout(async () => {
            this.searchOffset = 0
            this.searchResults = await this.search()
        }, 100)
    },

    async search () {
        const response = await axios.get(`${this.baseUrl}/search`, {params: {term: this.searchTerm, offset: this.searchOffset} })
        this.numHits = response.data.hits.total
        return response.data.hits.hits
    },

    async nextResultsPage () {
        if (this.numHits > 10) {
            this.searchOffset += 10
            if (this.searchOffset + 10 > this.numHits) {this.searchOffset = this.numHits - 10}
            this.searchResults = await this.search()
            document.documentElement.scrollTop = 0
        }
    },
    async prevResultsPage() {
        this.searchOffset -=10
        if (this.searchOffset < 0) {this.searchOffset = 0}
        this.searchResults = await this.search()
        document.documentElement.scrollTop = 0
    },

    async getParagraphs (bookTitle, offset) {
        try {
            this.bookOffset = offset
            const start = this.bookOffset
            const end = this.bookOffset + 10
            const response = await axios.get(`${this.baseUrl}/paragraphs`, {params: {bookTitle, start, end} })
            return response.data.hits.hits
        }   catch(err)  {
            console.error(err)
        }
    },
    async nextBookPage () {
        this.$refs.bookModal.scrollTop = 0
        this.paragraphs = await this.getParagraphs(this.selectedParagraph._source.title, this.bookOffset + 10)
    },
    async prevBookPage () {
        this.$refs.bookModal.scrollTop = 0
        this.paragraphs = await this.getParagraphs(this.selectedParagraph._source.title, this.bookOffset - 10)
    },
    async showBookModal (searchHit) {
        try {
            document.body.style.overflow = 'hidden'
            this.selectedParagraph = searchHit
            this.paragraphs = await this.getParagraphs(searchHit._source.title, searchHit._source.location - 5)
        }   catch (err) {
            console.error(err)
        }
    },

    closeBookModal () {
        document.body.style.overflow = 'auto'
        this.selectedParagraph = null
    }
}
})