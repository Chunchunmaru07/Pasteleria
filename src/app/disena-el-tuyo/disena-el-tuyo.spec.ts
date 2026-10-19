import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DisenaElTuyo } from './disena-el-tuyo';

describe('DisenaElTuyo', () => {
  let component: DisenaElTuyo;
  let fixture: ComponentFixture<DisenaElTuyo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisenaElTuyo],
    }).compileComponents();

    fixture = TestBed.createComponent(DisenaElTuyo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
