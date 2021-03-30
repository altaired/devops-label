"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("../src/index");
var config = {
    categories: {
        essay: {
            suffix: '**',
            proposal: 'README.md',
            folder: '+([a-zA-Z])?(-+([a-zA-Z]))',
            glob: 'demo/contributions/essay/',
        },
        presentation: {
            suffix: '**',
            proposal: 'README.md',
            folder: '+([a-zA-Z])?(-+([a-zA-Z]))',
            glob: 'demo/contributions/presentation/week[1-9]/',
        },
        demo: {
            suffix: '*',
            proposal: 'README.md',
            folder: '+([a-zA-Z])?(-+([a-zA-Z]))',
            glob: 'demo/contributions/demo/',
        },
    },
};
describe('directory', function () {
    it('has same directory', function () {
        var files = [
            { filename: 'demo/contributions/presentation/week2/siper/README.md', status: 'added' },
            { filename: 'demo/contributions/presentation/week2/siper/SAMPLE.md', status: 'modified' },
        ];
        expect(index_1.checkSameDirectory(files, config.categories.presentation)).toBeTruthy();
    });
    it('has different directories', function () {
        var files = [
            { filename: 'demo/contributions/presentation/week2/siper/README.md', status: 'added' },
            { filename: 'demo/contributions/presentation/week2/touma/SAMPLE.md', status: 'modified' },
            { filename: 'demo/contributions/presentation/week9/touma/SAMPLE.md', status: 'modified' },
        ];
        expect(index_1.checkSameDirectory(files, config.categories.presentation)).toBeFalsy();
    });
    it('different sub directory', function () {
        var files = [
            { filename: 'demo/contributions/presentation/week2/siper/README.md', status: 'added' },
            { filename: 'demo/contributions/presentation/week9/siper/README.md', status: 'added' },
        ];
        expect(index_1.checkSameDirectory(files, config.categories.presentation)).toBeFalsy();
    });
});
describe('category label', function () {
    it('multiple directories changed, should be undefined', function () {
        var files = [
            { filename: 'demo/contributions/presentation/week2/siper/README.md', status: 'added' },
            { filename: 'demo/contributions/presentation/week9/siper/README.md', status: 'modified' },
        ];
        expect(index_1.checkCategoryLabel(files, config.categories)).toBeUndefined();
    });
    it('same directory, presentation', function () {
        var files = [
            { filename: 'demo/contributions/presentation/week2/siper/README.md', status: 'added' },
            { filename: 'demo/contributions/presentation/week2/siper/Hello.md', status: 'modified' },
        ];
        expect(index_1.checkCategoryLabel(files, config.categories)).toBe('presentation');
    });
    it('should not allow subdirectories', function () {
        var files = [
            { filename: 'demo/contributions/demo/siper/README.md', status: 'added' },
            { filename: 'demo/contributions/demo/siper/test/Hello.md', status: 'modified' },
        ];
        expect(index_1.checkCategoryLabel(files, config.categories)).toBe(undefined);
    });
    it('should allow subdirectories', function () {
        var files = [
            { filename: 'demo/contributions/essay/siper/README.md', status: 'added' },
            { filename: 'demo/contributions/essay/siper/test/Hello.md', status: 'modified' },
        ];
        expect(index_1.checkCategoryLabel(files, config.categories)).toBe('essay');
    });
});
describe('proposal label', function () {
    it('should not have a proposal label, only modified', function () {
        var files = [
            { filename: 'demo/contributions/essay/siper/README.md', status: 'modified' },
            { filename: 'demo/contributions/essay/siper/ESSAY.md', status: 'modified' },
        ];
        expect(index_1.shouldHaveProposalLabel(files, config.categories.essay)).toBeFalsy();
    });
    it('should have a proposal label', function () {
        var files = [
            { filename: 'demo/contributions/essay/siper/README.md', status: 'added' },
            { filename: 'demo/contributions/essay/siper/ESSAY.md', status: 'modified' },
        ];
        expect(index_1.shouldHaveProposalLabel(files, config.categories.essay)).toBeTruthy();
    });
    it('should not have a proposal label, no proposal file included', function () {
        var files = [
            { filename: 'demo/contributions/essay/siper/HELLO.md', status: 'added' },
            { filename: 'demo/contributions/essay/siper/ESSAY.md', status: 'modified' },
        ];
        expect(index_1.shouldHaveProposalLabel(files, config.categories.essay)).toBeFalsy();
    });
});
