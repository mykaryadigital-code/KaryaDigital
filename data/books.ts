
export type Book = {
  id: number | string;
  title: string;
  author: string;
  category: string;
  price: number;
  oldPrice?: number;
  rating: number;
  color: string;
  accent: string;
  tag?: string;
  coverUrl?: string;
};
export const categories=['Semua','Novel','Bisnes','Kewangan','Agama','Motivasi','Pendidikan','Kesihatan'];
export const books:Book[]=[
{id:1,title:'Rahsia Urus Duit',author:'Aiman Hakimi',category:'Kewangan',price:19.9,oldPrice:29.9,rating:4.9,color:'#173c4c',accent:'#e9c782',tag:'Popular'},
{id:2,title:'Cinta Di Hujung Senja',author:'Nur Alya',category:'Novel',price:24.9,rating:4.8,color:'#7b3c60',accent:'#f6cfca',tag:'Baharu'},
{id:3,title:'Bisnes Dari Rumah',author:'Farid Zain',category:'Bisnes',price:29,oldPrice:39,rating:4.7,color:'#244b87',accent:'#aee5f3'},
{id:4,title:'Tenang Dalam Ujian',author:'Siti Maryam',category:'Agama',price:15,rating:4.9,color:'#316653',accent:'#f2dcac'},
{id:5,title:'Mulakan Hari Ini',author:'Daniel Azman',category:'Motivasi',price:18.9,rating:4.6,color:'#ba5c30',accent:'#fff0bc'},
{id:6,title:'Belajar Lebih Pintar',author:'Dr. Hana Rosli',category:'Pendidikan',price:22,rating:4.8,color:'#58478c',accent:'#f1c5ff'},
{id:7,title:'Hidup Lebih Sihat',author:'Nadia Zulkifli',category:'Kesihatan',price:16.9,rating:4.7,color:'#267f79',accent:'#d8ffe4'},
{id:8,title:'Langit Yang Sama',author:'Amir Danish',category:'Novel',price:21.9,oldPrice:27.9,rating:4.8,color:'#313e67',accent:'#d4d8ff'}
];
export const rm=(v:number)=>new Intl.NumberFormat('ms-MY',{style:'currency',currency:'MYR'}).format(v);
