import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isChapterTitleText,
  splitParagraphsIntoChapters,
  CHAPTER_HEADING_REGEX,
} from './epubParser.ts';

test('isChapterTitleText recognises standard Malay & English chapter and episode formats', () => {
  assert.equal(isChapterTitleText('EPISOD 1: Zon Selesa'), true);
  assert.equal(isChapterTitleText('Episod 2: Rahsia Gudang'), true);
  assert.equal(isChapterTitleText('Bab 1: Permulaan Kisah'), true);
  assert.equal(isChapterTitleText('BAB 10'), true);
  assert.equal(isChapterTitleText('Chapter 3: The Discovery'), true);
  assert.equal(isChapterTitleText('Bahagian 1'), true);
  assert.equal(isChapterTitleText('Prolog'), true);
  assert.equal(isChapterTitleText('Epilog: Akhir Kata'), true);

  // Normal paragraphs should NOT be chapter titles
  assert.equal(isChapterTitleText('Bau habuk kayu dan bunyi pita pelekat ditarik kuat memecah kesunyian.'), false);
  assert.equal(isChapterTitleText('Anim membetulkan topi snapback kesayangannya sebelum turun.'), false);
});

test('splitParagraphsIntoChapters splits 211 combined paragraphs into individual episodes', () => {
  const combinedParagraphs = [
    'Bau habuk kayu dan bunyi pita pelekat ditarik kuat memecah kesunyian di bahagian belakang gudang.',
    '"Barum!" panggil Anim.',
    'Dari celah susunan kotak almari, muncul kelibat seorang lelaki.',
    'EPISOD 2: Rahsia di Sebalik Gudang',
    'Keesokan harinya, Anim tiba awal pagi di gudang perabot.',
    'Lori trip pertama sudah siap sedia di hadapan pintu pemunggahan.',
    'EPISOD 3: Langkah Berani',
    'Anim memandang Barum dengan penuh harapan.',
    'Mereka menandatangani borang pengesahan akhir.',
  ];

  const result = splitParagraphsIntoChapters(combinedParagraphs, 'EPISOD 1: Zon Selesa', 1);

  assert.equal(result.length, 3);
  assert.equal(result[0].id, 1);
  assert.equal(result[0].title, 'EPISOD 1: Zon Selesa');
  assert.equal(result[0].paragraphs.length, 3);

  assert.equal(result[1].id, 2);
  assert.equal(result[1].title, 'EPISOD 2: Rahsia di Sebalik Gudang');
  assert.equal(result[1].paragraphs.length, 2);

  assert.equal(result[2].id, 3);
  assert.equal(result[2].title, 'EPISOD 3: Langkah Berani');
  assert.equal(result[2].paragraphs.length, 2);
});
