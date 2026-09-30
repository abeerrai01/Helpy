import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { extractCurrentQuestion } from '../transcriptMerge.mjs';

describe('extractCurrentQuestion', () => {
  test('single question is preserved unchanged', () => {
    assert.equal(
      extractCurrentQuestion('Tell me about yourself'),
      'Tell me about yourself'
    );
    assert.equal(
      extractCurrentQuestion('Why should we hire you?'),
      'Why should we hire you?'
    );
    assert.equal(
      extractCurrentQuestion('How do you invert a binary tree?'),
      'How do you invert a binary tree?'
    );
  });

  test('multiple questions separated by "  ·  " drops previous questions', () => {
    assert.equal(
      extractCurrentQuestion('tell me about yourself  ·  why we should hire you'),
      'why we should hire you'
    );
    assert.equal(
      extractCurrentQuestion('Tell me about yourself.  ·  Why should we hire you?'),
      'Why should we hire you?'
    );
    assert.equal(
      extractCurrentQuestion('What is your greatest strength?  ·  What is your greatest weakness?'),
      'What is your greatest weakness?'
    );
    assert.equal(
      extractCurrentQuestion('Can you introduce yourself  ·  Why do you want to work here?'),
      'Why do you want to work here?'
    );
  });

  test('multiple questions in unpunctuated text drops previous questions', () => {
    assert.equal(
      extractCurrentQuestion('tell me about yourself why we should hire you'),
      'why we should hire you'
    );
    assert.equal(
      extractCurrentQuestion('walk me through your resume what is your experience with node'),
      'what is your experience with node'
    );
    assert.equal(
      extractCurrentQuestion('can you tell me about yourself why should we hire you'),
      'why should we hire you'
    );
  });

  test('multiple questions with punctuation drops previous questions', () => {
    assert.equal(
      extractCurrentQuestion('Tell me about yourself. Why should we hire you?'),
      'Why should we hire you?'
    );
    assert.equal(
      extractCurrentQuestion('What is your experience with React? How do you optimize performance?'),
      'How do you optimize performance?'
    );
  });

  test('preserves introductory clauses that belong to the current question', () => {
    assert.equal(
      extractCurrentQuestion('Looking at your resume, why should we hire you?'),
      'Looking at your resume, why should we hire you?'
    );
    assert.equal(
      extractCurrentQuestion('In your previous role at Google, what was your biggest technical challenge?'),
      'In your previous role at Google, what was your biggest technical challenge?'
    );
    assert.equal(
      extractCurrentQuestion('Given an array of integers, find two numbers that sum to target'),
      'Given an array of integers, find two numbers that sum to target'
    );
  });

  test('preserves multi-segment current question split across STT chunks', () => {
    assert.equal(
      extractCurrentQuestion('Looking at your resume  ·  why should we hire you?'),
      'Looking at your resume why should we hire you?'
    );
    assert.equal(
      extractCurrentQuestion('In your last project  ·  what was your role?'),
      'In your last project what was your role?'
    );
  });

  test('handles empty, null, and whitespace inputs gracefully', () => {
    assert.equal(extractCurrentQuestion(''), '');
    assert.equal(extractCurrentQuestion('   '), '');
    assert.equal(extractCurrentQuestion(null), '');
    assert.equal(extractCurrentQuestion(undefined), '');
  });
});
