# Generated by Django 2.0.3 on 2018-08-06 02:51

from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('engine', '0003_auto_20180805_2141'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='keypoint',
            name='skeleton',
        ),
        migrations.RemoveField(
            model_name='labeledskeleton',
            name='job',
        ),
        migrations.RemoveField(
            model_name='labeledskeleton',
            name='label',
        ),
        migrations.RemoveField(
            model_name='labeledskeleton',
            name='skeleton_ptr',
        ),
        migrations.RemoveField(
            model_name='labeledskeletonattributeval',
            name='skeleton',
        ),
        migrations.RemoveField(
            model_name='labeledskeletonattributeval',
            name='spec',
        ),
        migrations.RemoveField(
            model_name='trackedskeleton',
            name='skeleton_ptr',
        ),
        migrations.RemoveField(
            model_name='trackedskeleton',
            name='track',
        ),
        migrations.RemoveField(
            model_name='trackedskeletonattributeval',
            name='skeleton',
        ),
        migrations.RemoveField(
            model_name='trackedskeletonattributeval',
            name='spec',
        ),
        migrations.AddField(
            model_name='job',
            name='updated_date',
            field=models.DateTimeField(auto_now_add=True, default=django.utils.timezone.now),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name='task',
            name='mode',
            field=models.CharField(max_length=32),
        ),
        migrations.AlterField(
            model_name='task',
            name='status',
            field=models.CharField(default='annotate', max_length=32),
        ),
        migrations.DeleteModel(
            name='Keypoint',
        ),
        migrations.DeleteModel(
            name='LabeledSkeleton',
        ),
        migrations.DeleteModel(
            name='LabeledSkeletonAttributeVal',
        ),
        migrations.DeleteModel(
            name='Skeleton',
        ),
        migrations.DeleteModel(
            name='TrackedSkeleton',
        ),
        migrations.DeleteModel(
            name='TrackedSkeletonAttributeVal',
        ),
    ]